import { prisma } from '@/lib/prisma';
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
