import { updateTemperatureRecordSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateTemperatureRecord, DeleteTemperatureRecord } from '@/domain/usecases/ManageTemperatureRecords';

export async function PUT(request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`temperature-records-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const container = createServerDIContainer(userId);
    const { recordId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: recordId,
      finder: (id) => container.temperatureRecordRepository.findById(id),
      resourceName: '体温記録',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updateTemperatureRecordSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const usecase = new UpdateTemperatureRecord(container.temperatureRecordRepository);
        const updated = await usecase.execute(recordId, {
          temperature: parsed.data.temperature,
          measuredAt: parsed.data.measuredAt,
          notes: parsed.data.notes,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`temperature-records-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const container = createServerDIContainer(userId);
    const { recordId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: recordId,
      finder: (id) => container.temperatureRecordRepository.findById(id),
      resourceName: '体温記録',
      handler: async () => {
        const usecase = new DeleteTemperatureRecord(container.temperatureRecordRepository);
        await usecase.execute(recordId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
