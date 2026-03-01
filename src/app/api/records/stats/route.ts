import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const [weeklyRecords, monthlyRecords, schedules, members] = await Promise.all([
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: sevenDaysAgo } },
      select: { memberId: true, medicationId: true, takenAt: true },
    }),
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: thirtyDaysAgo } },
      select: { memberId: true, medicationId: true, takenAt: true },
    }),
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      select: { memberId: true, medicationId: true, daysOfWeek: true },
    }),
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true },
    }),
  ]);

  // 1週間のスケジュール数を計算（各スケジュールの有効曜日数）
  const weeklyExpected = schedules.reduce((sum, s) => sum + Math.min(s.daysOfWeek.length, 7), 0);
  const monthlyExpected = schedules.reduce((sum, s) => {
    const daysPerWeek = s.daysOfWeek.length;
    return sum + Math.round(daysPerWeek * (30 / 7));
  }, 0);

  // メンバー別の統計
  const memberStats = members.map((member) => {
    const memberSchedules = schedules.filter((s) => s.memberId === member.id);
    const memberWeekly = weeklyRecords.filter((r) => r.memberId === member.id);
    const memberMonthly = monthlyRecords.filter((r) => r.memberId === member.id);

    const expected7 = memberSchedules.reduce((sum, s) => sum + Math.min(s.daysOfWeek.length, 7), 0);
    const expected30 = memberSchedules.reduce((sum, s) => {
      return sum + Math.round(s.daysOfWeek.length * (30 / 7));
    }, 0);

    return {
      memberId: member.id,
      memberName: member.name,
      weeklyRate: expected7 > 0 ? Math.min(100, Math.round((memberWeekly.length / expected7) * 100)) : 0,
      monthlyRate: expected30 > 0 ? Math.min(100, Math.round((memberMonthly.length / expected30) * 100)) : 0,
      weeklyCount: memberWeekly.length,
      monthlyCount: memberMonthly.length,
    };
  });

  return success({
    overall: {
      weeklyRate: weeklyExpected > 0 ? Math.min(100, Math.round((weeklyRecords.length / weeklyExpected) * 100)) : 0,
      monthlyRate: monthlyExpected > 0 ? Math.min(100, Math.round((monthlyRecords.length / monthlyExpected) * 100)) : 0,
      weeklyCount: weeklyRecords.length,
      monthlyCount: monthlyRecords.length,
    },
    members: memberStats,
  });
});
