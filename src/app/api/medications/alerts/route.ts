import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const now = new Date();

  const medications = await prisma.medication.findMany({
    where: {
      userId,
      isActive: true,
      stockAlertDate: { not: null },
    },
    include: { member: { select: { id: true, name: true } } },
    orderBy: { stockAlertDate: 'asc' },
    take: 500,
  });

  const alerts = medications
    .filter((med) => {
      if (!med.stockAlertDate) return false;
      const daysUntil = Math.ceil((med.stockAlertDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 14;
    })
    .map((med) => {
      const daysUntil = Math.ceil((med.stockAlertDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        medicationId: med.id,
        medicationName: med.name,
        memberId: med.memberId,
        memberName: med.member.name,
        stockQuantity: med.stockQuantity,
        stockAlertDate: med.stockAlertDate!.toISOString(),
        daysUntilAlert: daysUntil,
        isOverdue: daysUntil <= 0,
      };
    });

  return success(alerts);
});
