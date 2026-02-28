import { prisma } from '@/lib/prisma';
import { getAuthUserId, success, errorResponse, unauthorized } from '@/lib/auth-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { memberId } = await params;
    const medications = await prisma.medication.findMany({ where: { memberId, userId } });
    return success(medications);
  } catch {
    return errorResponse('一覧取得に失敗しました', 500);
  }
}
