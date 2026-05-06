import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { prisma } from '@/lib/prisma';
import { QUERY_LIMITS } from '@/lib/constants';

const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

function getJSTDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function getJSTDayBoundariesForDate(jstDate: Date): { start: Date; end: Date } {
  const year = jstDate.getUTCFullYear();
  const month = jstDate.getUTCMonth();
  const day = jstDate.getUTCDate();
  return {
    start: new Date(Date.UTC(year, month, day, -9, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, day, -9 + 23, 59, 59, 999)),
  };
}

function isScheduleActiveOnDate(
  schedule: { daysOfWeek: string[]; intervalDays: number | null; startDate: Date | null; createdAt: Date },
  jstDate: Date,
): boolean {
  if (schedule.intervalDays === -1) return false;

  // スケジュール作成日より前の日付はスキップ
  const createdJst = new Date(schedule.createdAt.getTime() + 9 * 60 * 60 * 1000);
  const createdDay = Date.UTC(createdJst.getUTCFullYear(), createdJst.getUTCMonth(), createdJst.getUTCDate());
  const targetDay = Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate());
  if (targetDay < createdDay) return false;

  if (schedule.intervalDays && schedule.intervalDays > 0 && schedule.startDate) {
    const startUtc = new Date(schedule.startDate);
    const startJst = new Date(startUtc.getTime() + 9 * 60 * 60 * 1000);
    const startDay = Date.UTC(startJst.getUTCFullYear(), startJst.getUTCMonth(), startJst.getUTCDate());
    const diffDays = Math.round((targetDay - startDay) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return false;
    return diffDays % schedule.intervalDays === 0;
  }

  if (schedule.daysOfWeek.length === 0) return true;

  const dayCode = DAY_MAP[jstDate.getUTCDay()];
  return schedule.daysOfWeek.includes(dayCode);
}

/** 過去7日間の飲み忘れスケジュールを取得 */
export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-missed:${userId}`, { maxAttempts: 20, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const LOOKBACK_DAYS = 7;
  const jstNow = getJSTDate();

  // 過去7日分の日付(今日を除く)を生成
  const pastDates: Date[] = [];
  for (let i = 1; i <= LOOKBACK_DAYS; i++) {
    const d = new Date(jstNow);
    d.setUTCDate(d.getUTCDate() - i);
    pastDates.push(d);
  }

  const oldestBoundary = getJSTDayBoundariesForDate(pastDates[pastDates.length - 1]);

  const [schedules, records, members] = await Promise.all([
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      include: { medication: { select: { name: true } } },
      take: QUERY_LIMITS.SCHEDULES,
    }),
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: oldestBoundary.start } },
      select: { scheduleId: true, medicationId: true, memberId: true, takenAt: true },
      take: QUERY_LIMITS.RECORDS,
    }),
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true },
      take: QUERY_LIMITS.MEMBERS,
    }),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  // 各日付のレコードをインデックス化
  const recordsByDate = new Map<string, Set<string>>();
  const manualRecordsByDate = new Map<string, Map<string, number>>();
  for (const r of records) {
    const rJst = new Date(r.takenAt.getTime() + 9 * 60 * 60 * 1000);
    const dateKey = `${rJst.getUTCFullYear()}-${String(rJst.getUTCMonth() + 1).padStart(2, '0')}-${String(rJst.getUTCDate()).padStart(2, '0')}`;
    if (r.scheduleId) {
      if (!recordsByDate.has(dateKey)) recordsByDate.set(dateKey, new Set());
      recordsByDate.get(dateKey)!.add(r.scheduleId);
    } else {
      if (!manualRecordsByDate.has(dateKey)) manualRecordsByDate.set(dateKey, new Map());
      const medMap = manualRecordsByDate.get(dateKey)!;
      const manualKey = `${r.memberId}:${r.medicationId}`;
      medMap.set(manualKey, (medMap.get(manualKey) || 0) + 1);
    }
  }

  interface MissedDose {
    date: string;
    scheduleId: string;
    medicationId: string;
    medicationName: string;
    memberName: string;
    memberId: string;
    scheduledTime: string;
  }

  const missed: MissedDose[] = [];

  for (const jstDate of pastDates) {
    const dateKey = `${jstDate.getUTCFullYear()}-${String(jstDate.getUTCMonth() + 1).padStart(2, '0')}-${String(jstDate.getUTCDate()).padStart(2, '0')}`;
    const completedIds = recordsByDate.get(dateKey) || new Set();
    const manualCounts = manualRecordsByDate.get(dateKey) || new Map();

    // 手動記録をスケジュールに割り当て
    const activeSchedules = schedules.filter((s) => isScheduleActiveOnDate(s, jstDate));
    const manualCompletedIds = new Set<string>();
    const medGroups = new Map<string, typeof activeSchedules>();
    for (const s of activeSchedules) {
      const scheduleKey = `${s.memberId}:${s.medicationId}`;
      const g = medGroups.get(scheduleKey) || [];
      g.push(s);
      medGroups.set(scheduleKey, g);
    }
    for (const [scheduleKey, group] of medGroups) {
      const count = manualCounts.get(scheduleKey) || 0;
      if (count === 0) continue;
      const uncompleted = group
        .filter((s) => !completedIds.has(s.id))
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
      for (let i = 0; i < Math.min(count, uncompleted.length); i++) {
        manualCompletedIds.add(uncompleted[i].id);
      }
    }

    for (const s of activeSchedules) {
      if (!completedIds.has(s.id) && !manualCompletedIds.has(s.id)) {
        missed.push({
          date: dateKey,
          scheduleId: s.id,
          medicationId: s.medicationId,
          medicationName: s.medication.name,
          memberName: memberMap.get(s.memberId) || '',
          memberId: s.memberId,
          scheduledTime: s.scheduledTime,
        });
      }
    }
  }

  return success(missed);
});
