import { prisma } from '@/lib/prisma';
import { createAllergySchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations, safeParseJson } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`allergies-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const allergies = await prisma.allergy.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: QUERY_LIMITS.DEFAULT,
    include: {
      member: { select: { name: true } },
    },
  });
  const result = allergies.map((a) =>
    flattenRelations(a, { member: 'memberName' }),
  );
  return success(result);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`allergies-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createAllergySchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const allergy = await prisma.allergy.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        allergenName: parsed.data.allergenName,
        allergyType: parsed.data.allergyType,
        severity: parsed.data.severity,
        symptoms: parsed.data.symptoms,
        diagnosedAt: parsed.data.diagnosedAt ? new Date(parsed.data.diagnosedAt) : undefined,
        notes: parsed.data.notes,
      },
    });
    return created(allergy);
  })();
}
