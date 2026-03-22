/**
 * サーバーサイド用 スケジュールリポジトリ実装（Prisma）
 * CreateMedicationWithSchedule usecase で使用される
 */

import { prisma } from '@/lib/prisma';
import {
  ScheduleRepository,
  ScheduleWithDetails,
  TodayScheduleQuery,
  TodayScheduleItem,
} from '@/domain/repositories/ScheduleRepository';
import { Schedule, DayOfWeek } from '@/domain/entities/Schedule';

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

export class PrismaScheduleRepository implements ScheduleRepository {
  constructor(private readonly userId: string) {}

  async getSchedules(): Promise<ScheduleWithDetails[]> {
    const rows = await prisma.schedule.findMany({
      where: { userId: this.userId },
      include: {
        medication: { select: { name: true } },
      },
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

  async getTodaySchedules(_query: TodayScheduleQuery): Promise<TodayScheduleItem[]> {
    // 今日のスケジュール取得は別のAPIルートで処理されるため、ここでは最小限の実装
    return [];
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

  async updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule> {
    const data: Record<string, unknown> = {};
    if (schedule.scheduledTime !== undefined) data.scheduledTime = schedule.scheduledTime;
    if (schedule.daysOfWeek !== undefined) data.daysOfWeek = [...schedule.daysOfWeek];
    if (schedule.intervalDays !== undefined) data.intervalDays = schedule.intervalDays;
    if (schedule.startDate !== undefined) data.startDate = schedule.startDate;
    if (schedule.isEnabled !== undefined) data.isEnabled = schedule.isEnabled;
    if (schedule.reminderMinutesBefore !== undefined) data.reminderMinutesBefore = schedule.reminderMinutesBefore;

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

  async markAsCompleted(_scheduleId: string, _completedAt: Date): Promise<void> {
    // 服薬完了は MedicationRecord の作成で管理されるため、ここでは空実装
  }
}
