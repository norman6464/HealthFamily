import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { DeleteMedicationRecord } from '@/domain/usecases/ManageMedicationRecords';

export async function DELETE(_request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`records-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { recordId } = await params;
    const idError = validateParamId(recordId);
    if (idError) return idError;

    const container = createServerDIContainer(userId);
    const usecase = new DeleteMedicationRecord(container.medicationRecordRepository);

    try {
      await usecase.execute(recordId);
      return success({ message: '削除しました' });
    } catch (error) {
      if (error instanceof Error && error.message === '服薬記録が見つかりません') {
        return errorResponse('服薬記録が見つかりません', 404);
      }
      throw error;
    }
  })();
}
