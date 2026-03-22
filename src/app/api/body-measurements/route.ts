import { prisma } from '@/lib/prisma';
import { createBodyMeasurementSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetBodyMeasurements, CreateBodyMeasurement } from '@/domain/usecases/ManageBodyMeasurements';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`body-measurements-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetBodyMeasurements(container.bodyMeasurementRepository);
  const measurements = await usecase.execute();
  return success(measurements);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`body-measurements-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createBodyMeasurementSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const container = createServerDIContainer(userId);
    const usecase = new CreateBodyMeasurement(container.bodyMeasurementRepository);
    const measurement = await usecase.execute({
      memberId: parsed.data.memberId,
      weight: parsed.data.weight,
      height: parsed.data.height,
      recordedAt: parsed.data.recordedAt,
      notes: parsed.data.notes,
    });
    return created(measurement);
  })();
}
