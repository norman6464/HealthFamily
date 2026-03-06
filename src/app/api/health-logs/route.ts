import { prisma } from '@/lib/prisma';
import { createHealthLogSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations , safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`health-logs-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const logs = await prisma.healthLog.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: QUERY_LIMITS.DEFAULT,
    include: {
      member: { select: { name: true } },
    },
  });
  const result = logs.map((log) =>
    flattenRelations(log, { member: 'memberName' }),
  );
  return success(result);
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

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const log = await prisma.healthLog.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        conditionLevel: parsed.data.conditionLevel,
        symptoms: parsed.data.symptoms ?? [],
        notes: parsed.data.notes,
      },
    });
    return created(log);
  })();
}
