import { prisma } from '@/lib/prisma';
import { updateUserProfileSchema } from '@/lib/schemas';
import { success, errorResponse, notFound } from '@/lib/auth-helpers';
import { withAuth, validateBodySize } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const USER_SELECT = {
  id: true,
  email: true,
  displayName: true,
  characterType: true,
  characterName: true,
} as const;

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`users-me-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
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
    const rateLimit = checkRateLimit(`profile:${userId}`, { maxAttempts: 10, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('更新回数の上限に達しました。しばらくしてから再試行してください。', 429);
    }

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
