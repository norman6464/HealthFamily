import { prisma } from '@/lib/prisma';
import { createVaccinationSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations, safeParseJson } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`vaccinations-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const vaccinations = await prisma.vaccination.findMany({
    where: { userId },
    orderBy: { nextScheduledDate: { sort: 'asc', nulls: 'last' } },
    take: QUERY_LIMITS.DEFAULT,
    include: {
      member: { select: { name: true } },
    },
  });
  const result = vaccinations.map((v) =>
    flattenRelations(v, { member: 'memberName' }),
  );
  return success(result);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`vaccinations-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createVaccinationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const vaccination = await prisma.vaccination.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        vaccineName: parsed.data.vaccineName,
        vaccinatedAt: new Date(parsed.data.vaccinatedAt),
        nextScheduledDate: parsed.data.nextScheduledDate ? new Date(parsed.data.nextScheduledDate) : undefined,
        notes: parsed.data.notes,
      },
    });
    return created(vaccination);
  })();
}
