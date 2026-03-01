import { prisma } from '@/lib/prisma';
import { updateMemberSchema } from '@/lib/schemas';
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

export async function PUT(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { memberId } = await params;
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.userId !== userId) return notFound('メンバー');

    const body = await request.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.petType !== undefined) data.petType = parsed.data.petType;
    if (parsed.data.birthDate !== undefined) {
      data.birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
    }
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

    const updated = await prisma.member.update({
      where: { id: memberId },
      data,
    });
    return success(updated);
  } catch {
    return errorResponse('更新に失敗しました', 500);
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
