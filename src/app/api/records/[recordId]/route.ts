import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateParamId, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { DeleteMedicationRecord, UpdateMedicationRecord } from '@/domain/usecases/ManageMedicationRecords';
import { updateRecordSchema } from '@/lib/schemas';

export async function PATCH(request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`records-update:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { recordId } = await params;
    const idError = validateParamId(recordId);
    if (idError) return idError;

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const parsed = updateRecordSchema.safeParse(jsonResult.data);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new UpdateMedicationRecord(container.medicationRecordRepository);

    try {
      await usecase.execute(recordId, parsed.data);
      return success({ message: '更新しました' });
    } catch (error) {
      if (error instanceof Error && error.message === '服薬記録が見つかりません') {
        return errorResponse('服薬記録が見つかりません', 404);
      }
      throw error;
    }
  })();
}

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
