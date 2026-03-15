import { prisma } from '@/lib/prisma';
import { createPrescriptionSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations, safeParseJson } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`prescriptions-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const prescriptions = await prisma.prescription.findMany({
    where: { userId },
    orderBy: { prescribedAt: 'desc' },
    take: QUERY_LIMITS.DEFAULT,
    include: {
      member: { select: { name: true } },
    },
  });
  const result = prescriptions.map((p) =>
    flattenRelations(p, { member: 'memberName' }),
  );
  return success(result);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`prescriptions-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createPrescriptionSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const prescription = await prisma.prescription.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        prescriptionName: parsed.data.prescriptionName,
        prescribedBy: parsed.data.prescribedBy,
        prescribedAt: new Date(parsed.data.prescribedAt),
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
        pharmacyName: parsed.data.pharmacyName,
        notes: parsed.data.notes,
      },
    });
    return created(prescription);
  })();
}
