import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

export const GET = withAuth(async (userId) => {
  const now = new Date();

  const [medications, schedules] = await Promise.all([
    prisma.medication.findMany({
      where: {
        userId,
        isActive: true,
        stockAlertDate: { not: null },
      },
      include: { member: { select: { id: true, name: true } } },
      orderBy: { stockAlertDate: 'asc' },
      take: 500,
    }),
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      select: { medicationId: true },
      take: 5000,
    }),
  ]);

  // 各薬の1日あたりのスケジュール数をカウント
  const scheduleCountByMed = new Map<string, number>();
  for (const s of schedules) {
    scheduleCountByMed.set(s.medicationId, (scheduleCountByMed.get(s.medicationId) ?? 0) + 1);
  }

  const alerts = medications
    .filter((med) => {
      if (!med.stockAlertDate) return false;
      const daysUntil = Math.ceil((med.stockAlertDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 14;
    })
    .map((med) => {
      const daysUntil = Math.ceil((med.stockAlertDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const dailyConsumption = scheduleCountByMed.get(med.id) ?? 0;
      const remainingDays = StockAlertEntity.calculateRemainingDays(med.stockQuantity, dailyConsumption);

      return {
        medicationId: med.id,
        medicationName: med.name,
        memberId: med.memberId,
        memberName: med.member.name,
        stockQuantity: med.stockQuantity,
        stockAlertDate: med.stockAlertDate!.toISOString(),
        daysUntilAlert: daysUntil,
        isOverdue: daysUntil <= 0,
        remainingDays,
      };
    });

  return success(alerts);
});
