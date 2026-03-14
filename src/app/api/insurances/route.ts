import { prisma } from '@/lib/prisma';
import { createInsuranceSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations, safeParseJson } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`insurances-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const insurances = await prisma.insurance.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: QUERY_LIMITS.DEFAULT,
    include: {
      member: { select: { name: true } },
    },
  });
  const result = insurances.map((i) =>
    flattenRelations(i, { member: 'memberName' }),
  );
  return success(result);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`insurances-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createInsuranceSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const insurance = await prisma.insurance.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        insuranceType: parsed.data.insuranceType,
        providerName: parsed.data.providerName,
        policyNumber: parsed.data.policyNumber,
        notes: parsed.data.notes,
      },
    });
    return created(insurance);
  })();
}
