import { prisma } from '@/lib/prisma';
import { getAuthUserId, success, errorResponse, unauthorized } from '@/lib/auth-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { memberId } = await params;
    const records = await prisma.medicationRecord.findMany({
      where: { memberId, userId },
      orderBy: { takenAt: 'desc' },
      take: 50,
    });
    return success(records);
  } catch {
    return errorResponse('一覧取得に失敗しました', 500);
  }
}
