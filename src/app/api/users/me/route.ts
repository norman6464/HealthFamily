import { prisma } from '@/lib/prisma';
import { updateUserProfileSchema } from '@/lib/schemas';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return notFound('ユーザー');

    return success({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      characterType: user.characterType,
      characterName: user.characterName,
    });
  } catch {
    return errorResponse('取得に失敗しました', 500);
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const parsed = updateUserProfileSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { displayName: parsed.data.displayName },
    });

    return success({
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      characterType: updated.characterType,
      characterName: updated.characterName,
    });
  } catch {
    return errorResponse('更新に失敗しました', 500);
  }
}
