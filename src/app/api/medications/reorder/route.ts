import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { ReorderMedications } from '@/domain/usecases/ManageMedications';
import { z } from 'zod';

const reorderSchema = z.object({
  medicationIds: z.array(z.string().min(1).max(50)).min(1).max(100),
});

export async function PUT(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-reorder:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const parsed = reorderSchema.safeParse(jsonResult.data);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new ReorderMedications(container.medicationRepository);

    try {
      await usecase.execute(parsed.data.medicationIds);
      return success({ message: '並び順を更新しました' });
    } catch (error) {
      if (error instanceof Error && error.message === '権限がありません') {
        return errorResponse('権限がありません', 403);
      }
      throw error;
    }
  })();
}
