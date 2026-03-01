import { prisma } from '@/lib/prisma';
import { updateMedicationSchema } from '@/lib/schemas';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { medicationId } = await params;
    const medication = await prisma.medication.findUnique({ where: { id: medicationId } });
    if (!medication || medication.userId !== userId) return notFound('お薬');

    return success(medication);
  } catch {
    return errorResponse('取得に失敗しました', 500);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { medicationId } = await params;
    const medication = await prisma.medication.findUnique({ where: { id: medicationId } });
    if (!medication || medication.userId !== userId) return notFound('お薬');

    const body = await request.json();
    const parsed = updateMedicationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.category !== undefined) data.category = parsed.data.category;
    if (parsed.data.dosageAmount !== undefined) data.dosageAmount = parsed.data.dosageAmount;
    if (parsed.data.frequency !== undefined) data.frequency = parsed.data.frequency;
    if (parsed.data.stockQuantity !== undefined) data.stockQuantity = parsed.data.stockQuantity;
    if (parsed.data.stockAlertDate !== undefined) {
      data.stockAlertDate = parsed.data.stockAlertDate ? new Date(parsed.data.stockAlertDate) : null;
    }
    if (parsed.data.instructions !== undefined) data.instructions = parsed.data.instructions;
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

    const updated = await prisma.medication.update({
      where: { id: medicationId },
      data,
    });
    return success(updated);
  } catch {
    return errorResponse('更新に失敗しました', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { medicationId } = await params;
    const medication = await prisma.medication.findUnique({ where: { id: medicationId } });
    if (!medication || medication.userId !== userId) return notFound('お薬');

    await prisma.medication.delete({ where: { id: medicationId } });
    return success({ message: '削除しました' });
  } catch {
    return errorResponse('削除に失敗しました', 500);
  }
}
