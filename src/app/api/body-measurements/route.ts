import { prisma } from '@/lib/prisma';
import { createBodyMeasurementSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations, safeParseJson } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`body-measurements-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: QUERY_LIMITS.DEFAULT,
    include: {
      member: { select: { name: true } },
    },
  });
  const result = measurements.map((m) =>
    flattenRelations(m, { member: 'memberName' }),
  );
  return success(result);
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

    const measurement = await prisma.bodyMeasurement.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        weight: parsed.data.weight,
        height: parsed.data.height,
        recordedAt: new Date(parsed.data.recordedAt),
        notes: parsed.data.notes,
      },
    });
    return created(measurement);
  })();
}
