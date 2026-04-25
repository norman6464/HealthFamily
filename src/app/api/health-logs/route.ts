import { createHealthLogSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { CreateHealthLog } from '@/domain/usecases/ManageHealthLogs';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`health-logs-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const logs = await container.healthLogRepository.getLogs();
  return success(logs);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const rateLimit = checkRateLimit(`health-logs:${userId}`, { maxAttempts: 20, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('記録回数の上限に達しました。しばらくしてから再試行してください。', 429);
    }

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createHealthLogSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new CreateHealthLog(container.healthLogRepository);
    await usecase.execute({
      memberId: parsed.data.memberId,
      conditionLevel: parsed.data.conditionLevel,
      symptoms: parsed.data.symptoms ?? [],
      notes: parsed.data.notes,
    });
    return created({ success: true });
  })();
}
