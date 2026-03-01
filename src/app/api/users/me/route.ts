import { prisma } from '@/lib/prisma';
import { updateUserProfileSchema } from '@/lib/schemas';
import { success, errorResponse, notFound } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return notFound('ユーザー');

  return success({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    characterType: user.characterType,
    characterName: user.characterName,
  });
});

export async function PUT(request: Request) {
  return withAuth(async (userId) => {
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
  })();
}
