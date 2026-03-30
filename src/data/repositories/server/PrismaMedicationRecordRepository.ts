/**
 * サーバーサイド用 服薬記録リポジトリ実装（Prisma）
 */

import { prisma } from '@/lib/prisma';
import {
  MedicationRecordRepository,
  CreateRecordInput,
  UpdateRecordInput,
} from '@/domain/repositories/MedicationRecordRepository';
import { MedicationRecord } from '@/domain/entities/MedicationRecord';
import { AdherenceStats } from '@/domain/entities/AdherenceStats';
import { AdherenceTrend } from '@/domain/entities/AdherenceTrend';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';
import { DateRangeHelper } from '@/domain/entities/DateRange';
import { DAY_LABELS_JP, QUERY_LIMITS } from '@/lib/constants';

export class PrismaMedicationRecordRepository implements MedicationRecordRepository {
  constructor(private readonly userId: string) {}

  async getHistory(): Promise<MedicationRecord[]> {
    const records = await prisma.medicationRecord.findMany({
      where: { userId: this.userId },
      orderBy: { takenAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
      include: {
        member: { select: { name: true } },
        medication: { select: { name: true } },
      },
    });

    return records.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      memberName: r.member.name,
      medicationId: r.medicationId,
      medicationName: r.medication.name,
      userId: r.userId,
      scheduleId: r.scheduleId ?? undefined,
      takenAt: r.takenAt,
      notes: r.notes ?? undefined,
      dosageAmount: r.dosageAmount ?? undefined,
    }));
  }

  async getHistoryByMember(memberId: string): Promise<MedicationRecord[]> {
    const records = await prisma.medicationRecord.findMany({
      where: { memberId, userId: this.userId },
      orderBy: { takenAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
      include: {
        member: { select: { name: true } },
        medication: { select: { name: true } },
      },
    });

    return records.map((r) => ({
      id: r.id,
      memberId: r.memberId,
      memberName: r.member.name,
      medicationId: r.medicationId,
      medicationName: r.medication.name,
      userId: r.userId,
      scheduleId: r.scheduleId ?? undefined,
      takenAt: r.takenAt,
      notes: r.notes ?? undefined,
      dosageAmount: r.dosageAmount ?? undefined,
    }));
  }

  async createRecord(input: CreateRecordInput): Promise<void> {
    await prisma.medicationRecord.create({
      data: {
        userId: this.userId,
        memberId: input.memberId,
        medicationId: input.medicationId,
        scheduleId: input.scheduleId,
        notes: input.notes,
        dosageAmount: input.dosageAmount,
        ...(input.takenAt ? { takenAt: new Date(input.takenAt) } : {}),
      },
    });
  }

  async updateRecord(recordId: string, input: UpdateRecordInput): Promise<void> {
    const record = await prisma.medicationRecord.findFirst({
      where: { id: recordId, userId: this.userId },
    });
    if (!record) {
      throw new Error('服薬記録が見つかりません');
    }
    await prisma.medicationRecord.update({
      where: { id: recordId },
      data: {
        notes: input.notes === null ? null : input.notes,
      },
    });
  }

  async deleteRecord(recordId: string): Promise<void> {
    const record = await prisma.medicationRecord.findFirst({
      where: { id: recordId, userId: this.userId },
    });
    if (!record) {
      throw new Error('服薬記録が見つかりません');
    }
    await prisma.medicationRecord.delete({ where: { id: recordId } });
  }

  async getAdherenceStats(): Promise<AdherenceStats> {
    const now = new Date();
    const sevenDaysAgo = DateRangeHelper.daysAgo(7, now);
    const thirtyDaysAgo = DateRangeHelper.daysAgo(30, now);

    const [weeklyRecords, monthlyRecords, allRecordDates, schedules, members] = await Promise.all([
      prisma.medicationRecord.findMany({
        where: { userId: this.userId, takenAt: { gte: sevenDaysAgo } },
        select: { memberId: true, medicationId: true, takenAt: true },
        take: QUERY_LIMITS.RECORDS,
      }),
      prisma.medicationRecord.findMany({
        where: { userId: this.userId, takenAt: { gte: thirtyDaysAgo } },
        select: { memberId: true, medicationId: true, takenAt: true },
        take: QUERY_LIMITS.RECORDS,
      }),
      prisma.medicationRecord.findMany({
        where: { userId: this.userId },
        select: { takenAt: true },
        orderBy: { takenAt: 'desc' },
        take: QUERY_LIMITS.RECORDS,
      }),
      prisma.schedule.findMany({
        where: { userId: this.userId, isEnabled: true },
        select: { memberId: true, medicationId: true, daysOfWeek: true },
        take: QUERY_LIMITS.SCHEDULES,
      }),
      prisma.member.findMany({
        where: { userId: this.userId },
        select: { id: true, name: true },
        take: QUERY_LIMITS.MEMBERS,
      }),
    ]);

    const weeklyExpected = AdherenceStatsEntity.calculateWeeklyExpected(schedules);
    const monthlyExpected = AdherenceStatsEntity.calculateMonthlyExpected(schedules);

    const memberStats = members.map((member) => {
      const memberSchedules = schedules.filter((s) => s.memberId === member.id);
      const memberWeekly = weeklyRecords.filter((r) => r.memberId === member.id);
      const memberMonthly = monthlyRecords.filter((r) => r.memberId === member.id);

      const expected7 = AdherenceStatsEntity.calculateWeeklyExpected(memberSchedules);
      const expected30 = AdherenceStatsEntity.calculateMonthlyExpected(memberSchedules);

      return {
        memberId: member.id,
        memberName: member.name,
        weeklyRate: AdherenceStatsEntity.calculateRate(memberWeekly.length, expected7),
        monthlyRate: AdherenceStatsEntity.calculateRate(memberMonthly.length, expected30),
        weeklyCount: memberWeekly.length,
        monthlyCount: memberMonthly.length,
      };
    });

    const recordDates = allRecordDates.map((r) => r.takenAt);
    const currentStreak = AdherenceStatsEntity.calculateStreak(recordDates, now);
    const longestStreak = AdherenceStatsEntity.calculateLongestStreak(recordDates);

    return {
      overall: {
        weeklyRate: AdherenceStatsEntity.calculateRate(weeklyRecords.length, weeklyExpected),
        monthlyRate: AdherenceStatsEntity.calculateRate(monthlyRecords.length, monthlyExpected),
        weeklyCount: weeklyRecords.length,
        monthlyCount: monthlyRecords.length,
      },
      members: memberStats,
      streak: {
        current: currentStreak,
        longest: longestStreak,
        message: AdherenceStatsEntity.getStreakMessage(currentStreak),
      },
    };
  }

  async getAdherenceTrends(): Promise<AdherenceTrend> {
    const now = new Date();
    const fourteenDaysAgo = DateRangeHelper.daysAgo(14, now);
    const sevenDaysAgo = DateRangeHelper.daysAgo(7, now);

    const [records, schedules] = await Promise.all([
      prisma.medicationRecord.findMany({
        where: { userId: this.userId, takenAt: { gte: fourteenDaysAgo } },
        select: { takenAt: true },
        take: QUERY_LIMITS.RECORDS,
      }),
      prisma.schedule.findMany({
        where: { userId: this.userId, isEnabled: true },
        select: { daysOfWeek: true },
        take: QUERY_LIMITS.SCHEDULES,
      }),
    ]);

    const expectedByDay = DateRangeHelper.calculateExpectedByDayOfWeek(schedules);

    const currentByDay = new Array(7).fill(0);
    const previousByDay = new Array(7).fill(0);

    for (const record of records) {
      const dayOfWeek = record.takenAt.getDay();
      if (record.takenAt >= sevenDaysAgo) {
        currentByDay[dayOfWeek]++;
      } else {
        previousByDay[dayOfWeek]++;
      }
    }

    const dayOfWeekStats = DAY_LABELS_JP.map((label, i) => ({
      day: i,
      dayLabel: label,
      count: currentByDay[i],
      expected: expectedByDay[i],
      rate: AdherenceStatsEntity.calculateRate(currentByDay[i], expectedByDay[i]),
    }));

    const activeDays = dayOfWeekStats.filter((d) => d.expected > 0);
    const bestDay = activeDays.length > 0
      ? activeDays.reduce((a, b) => (a.rate >= b.rate ? a : b)).dayLabel
      : '-';
    const worstDay = activeDays.length > 0
      ? activeDays.reduce((a, b) => (a.rate <= b.rate ? a : b)).dayLabel
      : '-';

    const currentTotal = currentByDay.reduce((a, b) => a + b, 0);
    const previousTotal = previousByDay.reduce((a, b) => a + b, 0);
    const weeklyExpected = expectedByDay.reduce((a, b) => a + b, 0);

    const currentPeriodRate = AdherenceStatsEntity.calculateRate(currentTotal, weeklyExpected);
    const previousPeriodRate = AdherenceStatsEntity.calculateRate(previousTotal, weeklyExpected);

    return {
      dayOfWeekStats,
      bestDay,
      worstDay,
      previousPeriodRate,
      currentPeriodRate,
      rateChange: currentPeriodRate - previousPeriodRate,
    };
  }
}
