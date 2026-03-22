import { prisma } from '@/lib/prisma';
import { updateBodyMeasurementSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateBodyMeasurement, DeleteBodyMeasurement } from '@/domain/usecases/ManageBodyMeasurements';

const findMeasurement = (id: string) => prisma.bodyMeasurement.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ measurementId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`body-measurements-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { measurementId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: measurementId,
      finder: findMeasurement,
      resourceName: '体重・身長記録',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updateBodyMeasurementSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const container = createServerDIContainer(userId);
        const usecase = new UpdateBodyMeasurement(container.bodyMeasurementRepository);
        const updated = await usecase.execute(measurementId, {
          weight: parsed.data.weight,
          height: parsed.data.height,
          recordedAt: parsed.data.recordedAt,
          notes: parsed.data.notes,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ measurementId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`body-measurements-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { measurementId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: measurementId,
      finder: findMeasurement,
      resourceName: '体重・身長記録',
      handler: async () => {
        const container = createServerDIContainer(userId);
        const usecase = new DeleteBodyMeasurement(container.bodyMeasurementRepository);
        await usecase.execute(measurementId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
