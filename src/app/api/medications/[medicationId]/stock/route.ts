import { prisma } from '@/lib/prisma';
import { updateStockSchema } from '@/lib/schemas';
import { sendEmail, emailTemplates } from '@/lib/email';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize , safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const findMedicationWithMember = (id: string) =>
  prisma.medication.findUnique({ where: { id }, include: { member: true } });

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`stock-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { medicationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: medicationId,
      finder: findMedicationWithMember,
      resourceName: 'お薬',
      handler: async (medication) => {
        const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
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
                console.error('在庫不足メール送信エラー:', err);
              });
            }
          }
        }

        return success(updated);
      },
    });
  })();
}
