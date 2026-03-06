import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';
import { DateRangeHelper } from '@/domain/entities/DateRange';
import { DAY_LABELS_JP, QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`records-trends-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const now = new Date();
  const fourteenDaysAgo = DateRangeHelper.daysAgo(14, now);
  const sevenDaysAgo = DateRangeHelper.daysAgo(7, now);

  const [records, schedules] = await Promise.all([
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: fourteenDaysAgo } },
      select: { takenAt: true },
      take: QUERY_LIMITS.RECORDS,
    }),
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
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

  return success({
    dayOfWeekStats,
    bestDay,
    worstDay,
    previousPeriodRate,
    currentPeriodRate,
    rateChange: currentPeriodRate - previousPeriodRate,
  });
});
