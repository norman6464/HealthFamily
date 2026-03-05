import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';
import { DAY_LABELS_JP } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const now = new Date();
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [records, schedules] = await Promise.all([
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: fourteenDaysAgo } },
      select: { takenAt: true },
      take: 5000,
    }),
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      select: { daysOfWeek: true },
      take: 1000,
    }),
  ]);

  const dayToIndex: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

  // 曜日別の期待数
  const expectedByDay = new Array(7).fill(0);
  for (const schedule of schedules) {
    if (schedule.daysOfWeek.length === 0) {
      for (let i = 0; i < 7; i++) expectedByDay[i] += 1;
    } else {
      for (const day of schedule.daysOfWeek) {
        const dayIndex = dayToIndex[day];
        if (dayIndex !== undefined) expectedByDay[dayIndex] += 1;
      }
    }
  }

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
