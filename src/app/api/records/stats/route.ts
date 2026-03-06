import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';
import { DateRangeHelper } from '@/domain/entities/DateRange';
import { QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`records-stats-get:${userId}`, { maxRequests: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const now = new Date();
  const sevenDaysAgo = DateRangeHelper.daysAgo(7, now);
  const thirtyDaysAgo = DateRangeHelper.daysAgo(30, now);

  const [weeklyRecords, monthlyRecords, allRecordDates, schedules, members] = await Promise.all([
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: sevenDaysAgo } },
      select: { memberId: true, medicationId: true, takenAt: true },
      take: QUERY_LIMITS.RECORDS,
    }),
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: thirtyDaysAgo } },
      select: { memberId: true, medicationId: true, takenAt: true },
      take: QUERY_LIMITS.RECORDS,
    }),
    prisma.medicationRecord.findMany({
      where: { userId },
      select: { takenAt: true },
      orderBy: { takenAt: 'desc' },
      take: QUERY_LIMITS.RECORDS,
    }),
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      select: { memberId: true, medicationId: true, daysOfWeek: true },
      take: QUERY_LIMITS.SCHEDULES,
    }),
    prisma.member.findMany({
      where: { userId },
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
