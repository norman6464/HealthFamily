import { prisma } from '@/lib/prisma';
import { createRecordSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const records = await prisma.medicationRecord.findMany({
    where: { userId },
    orderBy: { takenAt: 'desc' },
    take: 100,
    include: {
      member: { select: { name: true } },
      medication: { select: { name: true } },
    },
  });
  const result = records.map((r) => ({
    ...r,
    memberName: r.member.name,
    medicationName: r.medication.name,
    member: undefined,
    medication: undefined,
  }));
  return success(result);
});

export async function POST(request: Request) {
  return withAuth(async (userId) => {
    const body = await request.json();
    const parsed = createRecordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
      { finder: () => prisma.medication.findUnique({ where: { id: parsed.data.medicationId } }), resourceName: '薬' },
    ]);
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
