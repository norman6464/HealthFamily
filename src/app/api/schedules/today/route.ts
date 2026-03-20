import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

// jstDate は getJSTDate() で生成されたUTCフィールドにJST値が入ったDate
function isScheduleActiveToday(
  schedule: { daysOfWeek: string[]; intervalDays: number | null; startDate: Date | null },
  jstDate: Date,
): boolean {
  // 頓服（PRN）: ホーム画面に表示しない
  if (schedule.intervalDays === -1) {
    return false;
  }

  // 間隔スケジュール（X日ごと）
  if (schedule.intervalDays && schedule.intervalDays > 0 && schedule.startDate) {
    const startUtc = new Date(schedule.startDate);
    // startDateをJSTの日付として扱う(UTC+9)
    const startJst = new Date(startUtc.getTime() + 9 * 60 * 60 * 1000);
    // JSTの日付差を計算（UTCフィールドにJST値が入っている）
    const startDay = Date.UTC(startJst.getUTCFullYear(), startJst.getUTCMonth(), startJst.getUTCDate());
    const todayDay = Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate());
    const diffDays = Math.round((todayDay - startDay) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return false;
    return diffDays % schedule.intervalDays === 0;
  }

  // 曜日が未設定（空配列）の場合は毎日有効
  if (schedule.daysOfWeek.length === 0) {
    return true;
  }

  // 曜日チェック（jstDateのUTCフィールドにJST値が入っている）
  const todayDayCode = DAY_MAP[jstDate.getUTCDay()];
  return schedule.daysOfWeek.includes(todayDayCode);
}

// JST (UTC+9) の今日の日付を取得
function getJSTDate(): Date {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst;
}

function getJSTDayBoundaries(): { todayStart: Date; todayEnd: Date } {
  const jstNow = getJSTDate();
  const year = jstNow.getUTCFullYear();
  const month = jstNow.getUTCMonth();
  const day = jstNow.getUTCDate();
  // JST 00:00:00 = UTC 前日 15:00:00
  const todayStart = new Date(Date.UTC(year, month, day, -9, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month, day, -9 + 23, 59, 59, 999));
  return { todayStart, todayEnd };
}

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-today-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const jstToday = getJSTDate();
  const { todayStart, todayEnd } = getJSTDayBoundaries();

  const [schedules, todayRecords, members] = await Promise.all([
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      include: {
        medication: { select: { id: true, name: true, displayOrder: true } },
      },
      take: QUERY_LIMITS.SCHEDULES,
    }),
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: todayStart, lte: todayEnd } },
      select: { scheduleId: true, medicationId: true },
      take: QUERY_LIMITS.RECORDS,
    }),
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true, memberType: true },
      take: QUERY_LIMITS.MEMBERS,
    }),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const completedScheduleIds = new Set(
    todayRecords.filter((r) => r.scheduleId).map((r) => r.scheduleId as string)
  );

  // 同じ薬に複数スケジュールがあるかを判定するためのマップ
  const activeSchedules = schedules.filter((s) =>
    isScheduleActiveToday(s, jstToday)
  );
  const medicationScheduleCount = new Map<string, number>();
  for (const s of activeSchedules) {
    medicationScheduleCount.set(s.medicationId, (medicationScheduleCount.get(s.medicationId) || 0) + 1);
  }

  // scheduleIdなしの記録(手動記録)はスケジュールが1つだけの薬にのみ適用
  const manualCompletedMedicationIds = new Set(
    todayRecords
      .filter((r) => !r.scheduleId && (medicationScheduleCount.get(r.medicationId) || 0) <= 1)
      .map((r) => r.medicationId)
  );

  const result = activeSchedules.map((s) => {
    const member = memberMap.get(s.memberId);
    return {
      id: s.id,
      medicationId: s.medicationId,
      medicationName: s.medication.name,
      userId: s.userId,
      memberId: s.memberId,
      memberName: member?.name || '',
      memberType: member?.memberType || 'human',
      scheduledTime: s.scheduledTime,
      daysOfWeek: s.daysOfWeek,
      intervalDays: s.intervalDays,
      startDate: s.startDate?.toISOString(),
      isEnabled: s.isEnabled,
      reminderMinutesBefore: s.reminderMinutesBefore,
      medicationDisplayOrder: s.medication.displayOrder ?? 0,
      isCompleted: completedScheduleIds.has(s.id) || manualCompletedMedicationIds.has(s.medicationId),
      createdAt: s.createdAt.toISOString(),
    };
  });

  return success(result);
});
