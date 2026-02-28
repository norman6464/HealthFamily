import { prisma } from '@/lib/prisma';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { memberId } = await params;
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.userId !== userId) return notFound('メンバー');

    return success(member);
  } catch {
    return errorResponse('取得に失敗しました', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { memberId } = await params;
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.userId !== userId) return notFound('メンバー');

    await prisma.member.delete({ where: { id: memberId } });
    return success({ message: '削除しました' });
  } catch {
    return errorResponse('削除に失敗しました', 500);
  }
}
