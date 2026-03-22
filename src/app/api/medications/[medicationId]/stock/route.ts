import { prisma } from '@/lib/prisma';
import { updateStockSchema } from '@/lib/schemas';
import { sendEmail, emailTemplates } from '@/lib/email';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateMedication } from '@/domain/usecases/ManageMedications';

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`stock-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { medicationId } = await params;
    const idError = validateParamId(medicationId);
    if (idError) return idError;

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = updateStockSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new UpdateMedication(container.medicationRepository);

    let updated;
    try {
      updated = await usecase.execute(medicationId, {
        stockQuantity: parsed.data.stockQuantity,
      });
    } catch (error) {
      if (error instanceof Error && error.message === '薬が見つかりません') {
        return errorResponse('お薬が見つかりません', 404);
      }
      throw error;
    }

    // メール通知（インフラ関心事 - ドメイン外）
    if (updated.stockAlertDate && updated.stockQuantity !== undefined) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const alertDate = new Date(updated.stockAlertDate);
      alertDate.setHours(0, 0, 0, 0);
      const daysUntilAlert = Math.ceil(
        (alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilAlert > 0 && updated.stockQuantity < daysUntilAlert) {
        const [user, member] = await Promise.all([
          prisma.user.findUnique({ where: { id: userId } }),
          prisma.member.findUnique({ where: { id: updated.memberId } }),
        ]);
        if (user && member) {
          const template = emailTemplates.lowStockAlert({
            memberName: member.name,
            medicationName: updated.name,
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
  })();
}
