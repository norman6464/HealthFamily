import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetAdherenceTrends } from '@/domain/usecases/ManageMedicationRecords';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`records-trends-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const container = createServerDIContainer(userId);
  const usecase = new GetAdherenceTrends(container.medicationRecordRepository);
  const trends = await usecase.execute();

  return success(trends);
});
