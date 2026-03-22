import { updateUserProfileSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetUserProfile, UpdateUserProfile } from '@/domain/usecases/ManageUserProfile';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`users-me-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const container = createServerDIContainer(userId);
  const usecase = new GetUserProfile(container.userProfileRepository);

  try {
    const user = await usecase.execute();
    return success(user);
  } catch (error) {
    if (error instanceof Error && error.message === 'ユーザーが見つかりません') {
      return errorResponse('ユーザーが見つかりません', 404);
    }
    throw error;
  }
});

export async function PUT(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const rateLimit = checkRateLimit(`profile:${userId}`, { maxAttempts: 10, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('更新回数の上限に達しました。しばらくしてから再試行してください。', 429);
    }

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = updateUserProfileSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new UpdateUserProfile(container.userProfileRepository);
    const updated = await usecase.execute({ displayName: parsed.data.displayName });

    return success(updated);
  })();
}
