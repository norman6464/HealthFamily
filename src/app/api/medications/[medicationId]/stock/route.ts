import { prisma } from '@/lib/prisma';
import { updateStockSchema } from '@/lib/schemas';
import { sendEmail, emailTemplates } from '@/lib/email';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { medicationId } = await params;
    const medication = await prisma.medication.findUnique({
      where: { id: medicationId },
      include: { member: true },
    });
    if (!medication || medication.userId !== userId) return notFound('お薬');

    const body = await request.json();
    const parsed = updateStockSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const updated = await prisma.medication.update({
      where: { id: medicationId },
      data: { stockQuantity: parsed.data.stockQuantity },
    });

    // 在庫が閾値以下になったらメール送信
    if (
      updated.lowStockThreshold !== null &&
      updated.stockQuantity !== null &&
      updated.stockQuantity <= updated.lowStockThreshold
    ) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const template = emailTemplates.lowStockAlert({
          memberName: medication.member.name,
          medicationName: medication.name,
          currentStock: updated.stockQuantity,
          threshold: updated.lowStockThreshold,
        });
        sendEmail({ to: user.email, ...template }).catch((err) => {
          console.error('Low stock email failed:', err);
        });
      }
    }

    return success(updated);
  } catch (error) {
    console.error('Stock update error:', error);
    return errorResponse('更新に失敗しました', 500);
  }
}
