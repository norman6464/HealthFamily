import { prisma } from '@/lib/prisma';
import { updateUserProfileSchema } from '@/lib/schemas';
import { success, errorResponse, notFound } from '@/lib/auth-helpers';
import { withAuth, validateBodySize } from '@/lib/api-helpers';

const USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  characterType: true,
  characterName: true,
} as const;

export const GET = withAuth(async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_SELECT,
  });
  if (!user) return notFound('ユーザー');

  return success(user);
});

export async function PUT(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const body = await request.json();
    const parsed = updateUserProfileSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { displayName: parsed.data.displayName },
      select: USER_SELECT,
    });

    return success(updated);
  })();
}
