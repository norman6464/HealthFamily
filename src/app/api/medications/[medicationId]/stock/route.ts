import { prisma } from '@/lib/prisma';
import { updateStockSchema } from '@/lib/schemas';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { medicationId } = await params;
    const medication = await prisma.medication.findUnique({ where: { id: medicationId } });
    if (!medication || medication.userId !== userId) return notFound('お薬');

    const body = await request.json();
    const parsed = updateStockSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const updated = await prisma.medication.update({
      where: { id: medicationId },
      data: { stockQuantity: parsed.data.stockQuantity },
    });
    return success(updated);
  } catch {
    return errorResponse('更新に失敗しました', 500);
  }
}
