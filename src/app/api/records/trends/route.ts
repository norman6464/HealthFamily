import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
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
    }),
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      select: { daysOfWeek: true },
    }),
  ]);

  // 曜日別の期待数（スケジュールから）
  const expectedByDay = new Array(7).fill(0);
  for (const schedule of schedules) {
    for (const day of schedule.daysOfWeek) {
      const dayIndex = (DAY_LABELS_JP as readonly string[]).indexOf(day);
      if (dayIndex >= 0) expectedByDay[dayIndex] += 1;
    }
  }

  // 直近7日の曜日別実績
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
    rate: expectedByDay[i] > 0 ? Math.min(100, Math.round((currentByDay[i] / expectedByDay[i]) * 100)) : 0,
  }));

  // ベスト/ワーストの曜日（期待値のある曜日のみ）
  const activeDays = dayOfWeekStats.filter((d) => d.expected > 0);
  const bestDay = activeDays.length > 0
    ? activeDays.reduce((a, b) => (a.rate >= b.rate ? a : b)).dayLabel
    : '-';
  const worstDay = activeDays.length > 0
    ? activeDays.reduce((a, b) => (a.rate <= b.rate ? a : b)).dayLabel
    : '-';

  // 前期間と今期間の全体率
  const currentTotal = currentByDay.reduce((a, b) => a + b, 0);
  const previousTotal = previousByDay.reduce((a, b) => a + b, 0);
  const weeklyExpected = expectedByDay.reduce((a, b) => a + b, 0);

  const currentPeriodRate = weeklyExpected > 0 ? Math.min(100, Math.round((currentTotal / weeklyExpected) * 100)) : 0;
  const previousPeriodRate = weeklyExpected > 0 ? Math.min(100, Math.round((previousTotal / weeklyExpected) * 100)) : 0;

  return success({
    dayOfWeekStats,
    bestDay,
    worstDay,
    previousPeriodRate,
    currentPeriodRate,
    rateChange: currentPeriodRate - previousPeriodRate,
  });
});
