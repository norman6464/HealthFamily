import { updateNotificationSettingSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetNotificationSetting, UpdateNotificationSetting } from '@/domain/usecases/ManageNotificationSettings';
import { DEFAULT_NOTIFICATION_SETTING } from '@/domain/entities/NotificationSetting';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`notification-settings-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const container = createServerDIContainer(userId);
  const usecase = new GetNotificationSetting(container.notificationSettingRepository);
  const setting = await usecase.execute();

  if (!setting) {
    return success({
      userId,
      ...DEFAULT_NOTIFICATION_SETTING,
    });
  }
  return success(setting);
});

export async function PUT(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`notification-settings-put:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = updateNotificationSettingSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new UpdateNotificationSetting(container.notificationSettingRepository);
    const setting = await usecase.execute(parsed.data);
    return success(setting);
  })();
}
