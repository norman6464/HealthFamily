import { prisma } from '@/lib/prisma';
import { createHealthLogSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const logs = await prisma.healthLog.findMany({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
    take: 100,
    include: {
      member: { select: { name: true } },
    },
  });
  const result = logs.map((log) => ({
    ...log,
    memberName: log.member.name,
    member: undefined,
  }));
  return success(result);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const body = await request.json();
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
