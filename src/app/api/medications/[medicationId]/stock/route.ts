import { prisma } from '@/lib/prisma';
import { updateStockSchema } from '@/lib/schemas';
import { sendEmail, emailTemplates } from '@/lib/email';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';

const findMedicationWithMember = (id: string) =>
  prisma.medication.findUnique({ where: { id }, include: { member: true } });

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  return withAuth(async (userId) => {
    const { medicationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: medicationId,
      finder: findMedicationWithMember,
      resourceName: 'お薬',
      handler: async (medication) => {
        const body = await request.json();
        const parsed = updateStockSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const updated = await prisma.medication.update({
          where: { id: medicationId },
          data: { stockQuantity: parsed.data.stockQuantity },
        });

        if (updated.stockAlertDate !== null && updated.stockQuantity !== null) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const alertDate = new Date(updated.stockAlertDate);
          alertDate.setHours(0, 0, 0, 0);
          const daysUntilAlert = Math.ceil(
            (alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilAlert > 0 && updated.stockQuantity < daysUntilAlert) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user) {
              const template = emailTemplates.lowStockAlert({
                memberName: medication.member.name,
                medicationName: medication.name,
                currentStock: updated.stockQuantity,
                alertDate: alertDate.toLocaleDateString('ja-JP'),
                daysUntilAlert,
              });
              sendEmail({ to: user.email, ...template }).catch((err) => {
                console.error('Low stock email failed:', err);
              });
            }
          }
        }

        return success(updated);
      },
    });
  })();
}
