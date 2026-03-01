import { prisma } from '@/lib/prisma';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function DELETE(_request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { recordId } = await params;
    const record = await prisma.medicationRecord.findUnique({ where: { id: recordId } });
    if (!record || record.userId !== userId) return notFound('服薬記録');

    await prisma.medicationRecord.delete({ where: { id: recordId } });
    return success({ message: '削除しました' });
  } catch {
    return errorResponse('削除に失敗しました', 500);
  }
}
