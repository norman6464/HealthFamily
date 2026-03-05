import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

export const GET = withAuth(async (userId) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [weeklyRecords, monthlyRecords, allRecordDates, schedules, members] = await Promise.all([
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: sevenDaysAgo } },
      select: { memberId: true, medicationId: true, takenAt: true },
      take: 5000,
    }),
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: thirtyDaysAgo } },
      select: { memberId: true, medicationId: true, takenAt: true },
      take: 5000,
    }),
    prisma.medicationRecord.findMany({
      where: { userId },
      select: { takenAt: true },
      orderBy: { takenAt: 'desc' },
      take: 10000,
    }),
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      select: { memberId: true, medicationId: true, daysOfWeek: true },
      take: 1000,
    }),
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true },
      take: 100,
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

  return success({
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
  });
});
