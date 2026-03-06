import { prisma } from '@/lib/prisma';
import { createRecordSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations , safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`records-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const records = await prisma.medicationRecord.findMany({
    where: { userId },
    orderBy: { takenAt: 'desc' },
    take: QUERY_LIMITS.DEFAULT,
    include: {
      member: { select: { name: true } },
      medication: { select: { name: true } },
    },
  });
  const result = records.map((r) =>
    flattenRelations(r, { member: 'memberName', medication: 'medicationName' }),
  );
  return success(result);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const rateLimit = checkRateLimit(`records:${userId}`, { maxAttempts: 30, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('記録回数の上限に達しました。しばらくしてから再試行してください。', 429);
    }

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createRecordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipChecks = [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
      { finder: () => prisma.medication.findUnique({ where: { id: parsed.data.medicationId } }), resourceName: '薬' },
      ...(parsed.data.scheduleId ? [{ finder: () => prisma.schedule.findUnique({ where: { id: parsed.data.scheduleId } }), resourceName: 'スケジュール' }] : []),
    ];
    const ownershipError = await verifyResourceOwnership(userId, ownershipChecks);
    if (ownershipError) return ownershipError;

    const record = await prisma.medicationRecord.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        medicationId: parsed.data.medicationId,
        scheduleId: parsed.data.scheduleId,
        notes: parsed.data.notes,
        dosageAmount: parsed.data.dosageAmount,
      },
    });
    return created(record);
  })();
}
