/**
 * サーバーサイド用 スケジュールリポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  ScheduleRepository,
  ScheduleWithDetails,
  TodayScheduleQuery,
  TodayScheduleItem,
} from '@/domain/repositories/ScheduleRepository';
import { Schedule, DayOfWeek } from '@/domain/entities/Schedule';
import { QUERY_LIMITS } from '@/lib/constants';

function toSchedule(row: {
  id: string;
  medicationId: string;
  userId: string;
  memberId: string;
  scheduledTime: string;
  daysOfWeek: string[];
  intervalDays: number | null;
  startDate: Date | null;
  isEnabled: boolean;
  reminderMinutesBefore: number;
  createdAt: Date;
}): Schedule {
  return {
    id: row.id,
    medicationId: row.medicationId,
    userId: row.userId,
    memberId: row.memberId,
    scheduledTime: row.scheduledTime,
    daysOfWeek: row.daysOfWeek as DayOfWeek[],
    intervalDays: row.intervalDays ?? undefined,
    startDate: row.startDate ?? undefined,
    isEnabled: row.isEnabled,
    reminderMinutesBefore: row.reminderMinutesBefore,
    createdAt: row.createdAt,
  };
}

const DAY_MAP: Record<number, string> = {
  0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
};

function getJSTDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function getJSTDayBoundaries(): { todayStart: Date; todayEnd: Date } {
  const jstNow = getJSTDate();
  const year = jstNow.getUTCFullYear();
  const month = jstNow.getUTCMonth();
  const day = jstNow.getUTCDate();
  const todayStart = new Date(Date.UTC(year, month, day, -9, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month, day, -9 + 23, 59, 59, 999));
  return { todayStart, todayEnd };
}

function isScheduleActiveToday(
  schedule: { daysOfWeek: string[]; intervalDays: number | null; startDate: Date | null },
  jstDate: Date,
): boolean {
  if (schedule.intervalDays === -1) {
    return false;
  }

  if (schedule.intervalDays && schedule.intervalDays > 0 && schedule.startDate) {
    const startUtc = new Date(schedule.startDate);
    const startJst = new Date(startUtc.getTime() + 9 * 60 * 60 * 1000);
    const startDay = Date.UTC(startJst.getUTCFullYear(), startJst.getUTCMonth(), startJst.getUTCDate());
    const todayDay = Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate());
    const diffDays = Math.round((todayDay - startDay) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return false;
    return diffDays % schedule.intervalDays === 0;
  }

  if (schedule.daysOfWeek.length === 0) {
    return true;
  }

  const todayDayCode = DAY_MAP[jstDate.getUTCDay()];
  return schedule.daysOfWeek.includes(todayDayCode);
}

export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(private readonly userId: string) {}

  async findById(id: string): Promise<{ userId: string } | null> {
    return prisma.schedule.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });
  }

  async getSchedules(): Promise<ScheduleWithDetails[]> {
    const rows = await prisma.schedule.findMany({
      where: { userId: this.userId },
      include: {
        medication: { select: { name: true } },
      },
      take: QUERY_LIMITS.SCHEDULES,
    });

    const memberIds = [...new Set(rows.map((r) => r.memberId))];
    const members = await prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true },
    });
    const memberMap = new Map(members.map((m) => [m.id, m.name]));

    return rows.map((row) => ({
      schedule: toSchedule(row),
      medicationName: row.medication.name,
      memberName: memberMap.get(row.memberId) ?? '',
    }));
  }

  async getSchedulesRaw(): Promise<Schedule[]> {
    const rows = await prisma.schedule.findMany({
      where: { userId: this.userId },
      take: QUERY_LIMITS.SCHEDULES,
    });
    return rows.map(toSchedule);
  }

  async getTodaySchedules(_query: TodayScheduleQuery): Promise<TodayScheduleItem[]> {
    const jstToday = getJSTDate();
    const { todayStart, todayEnd } = getJSTDayBoundaries();

    const [schedules, todayRecords, members] = await Promise.all([
      prisma.schedule.findMany({
        where: { userId: this.userId, isEnabled: true },
        include: {
          medication: { select: { id: true, name: true, displayOrder: true } },
        },
        take: QUERY_LIMITS.SCHEDULES,
      }),
      prisma.medicationRecord.findMany({
        where: { userId: this.userId, takenAt: { gte: todayStart, lte: todayEnd } },
        select: { scheduleId: true, medicationId: true },
        take: QUERY_LIMITS.RECORDS,
      }),
      prisma.member.findMany({
        where: { userId: this.userId },
        select: { id: true, name: true, memberType: true },
        take: QUERY_LIMITS.MEMBERS,
      }),
    ]);

    const memberMap = new Map(members.map((m) => [m.id, m]));

    const completedScheduleIds = new Set(
      todayRecords.filter((r) => r.scheduleId).map((r) => r.scheduleId as string)
    );

    const activeSchedules = schedules.filter((s) =>
      isScheduleActiveToday(s, jstToday)
    );

    // 薬ごとの手動記録(scheduleIdなし)の件数を集計
    const manualRecordCountByMedication = new Map<string, number>();
    for (const r of todayRecords) {
      if (!r.scheduleId) {
        manualRecordCountByMedication.set(r.medicationId, (manualRecordCountByMedication.get(r.medicationId) || 0) + 1);
      }
    }

    // 薬ごとのスケジュールを時刻順に並べ、手動記録を古い時刻のスケジュールから割り当て
    const manualCompletedScheduleIds = new Set<string>();
    const medScheduleGroups = new Map<string, typeof activeSchedules>();
    for (const s of activeSchedules) {
      const group = medScheduleGroups.get(s.medicationId) || [];
      group.push(s);
      medScheduleGroups.set(s.medicationId, group);
    }
    for (const [medId, group] of medScheduleGroups) {
      const manualCount = manualRecordCountByMedication.get(medId) || 0;
      if (manualCount === 0) continue;
      const uncompletedBySchedule = group
        .filter((s) => !completedScheduleIds.has(s.id))
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
      for (let i = 0; i < Math.min(manualCount, uncompletedBySchedule.length); i++) {
        manualCompletedScheduleIds.add(uncompletedBySchedule[i].id);
      }
    }

    return activeSchedules.map((s) => {
      const member = memberMap.get(s.memberId);
      return {
        schedule: toSchedule(s),
        medicationName: s.medication.name,
        memberName: member?.name || '',
        memberType: (member?.memberType as 'human' | 'pet') || 'human',
        medicationDisplayOrder: s.medication.displayOrder ?? 0,
        isCompleted: completedScheduleIds.has(s.id) || manualCompletedScheduleIds.has(s.id),
      };
    });
  }

  async findOverlapping(medicationId: string, scheduledTime: string): Promise<Schedule | null> {
    const row = await prisma.schedule.findFirst({
      where: {
        userId: this.userId,
        medicationId,
        scheduledTime,
        isEnabled: true,
      },
    });
    return row ? toSchedule(row) : null;
  }

  async createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    const row = await prisma.schedule.create({
      data: {
        medicationId: schedule.medicationId,
        userId: this.userId,
        memberId: schedule.memberId,
        scheduledTime: schedule.scheduledTime,
        daysOfWeek: [...schedule.daysOfWeek],
        intervalDays: schedule.intervalDays,
        startDate: schedule.startDate,
        isEnabled: schedule.isEnabled,
        reminderMinutesBefore: schedule.reminderMinutesBefore,
      },
    });
    return toSchedule(row);
  }

  async updateSchedule(id: string, schedule: Partial<Schedule>, options?: { clearInterval?: boolean }): Promise<Schedule> {
    const data: Record<string, unknown> = {};
    if (schedule.scheduledTime !== undefined) data.scheduledTime = schedule.scheduledTime;
    if (schedule.daysOfWeek !== undefined) data.daysOfWeek = [...schedule.daysOfWeek];
    if (schedule.intervalDays !== undefined) data.intervalDays = schedule.intervalDays;
    if (schedule.startDate !== undefined) data.startDate = schedule.startDate;
    if (schedule.isEnabled !== undefined) data.isEnabled = schedule.isEnabled;
    if (schedule.reminderMinutesBefore !== undefined) data.reminderMinutesBefore = schedule.reminderMinutesBefore;
    if (options?.clearInterval) {
      data.intervalDays = null;
      data.startDate = null;
    }

    const existing = await prisma.schedule.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('スケジュールが見つかりません');
    }

    const row = await prisma.schedule.update({
      where: { id },
      data,
    });
    return toSchedule(row);
  }

  async deleteSchedule(id: string): Promise<void> {
    const existing = await prisma.schedule.findFirst({
      where: { id, userId: this.userId },
    });
    if (!existing) {
      throw new Error('スケジュールが見つかりません');
    }
    await prisma.schedule.delete({ where: { id } });
  }

  async markAsCompleted(_scheduleId: string, _completedAt: Date, _options?: { takenAt?: string; notes?: string }): Promise<void> {
    // 服薬完了は MedicationRecord の作成で管理されるため、ここでは空実装
  }
}
