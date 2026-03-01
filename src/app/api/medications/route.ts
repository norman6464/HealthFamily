import { prisma } from '@/lib/prisma';
import { createMedicationSchema } from '@/lib/schemas';
import { created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership } from '@/lib/api-helpers';

export async function POST(request: Request) {
  return withAuth(async (userId) => {
    const body = await request.json();
    const parsed = createMedicationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);
    if (!parsed.data.memberId) return errorResponse('メンバーIDは必須です');

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId! } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const medication = await prisma.medication.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        name: parsed.data.name,
        category: parsed.data.category ?? 'regular',
        dosageAmount: parsed.data.dosageAmount,
        frequency: parsed.data.frequency,
        stockQuantity: parsed.data.stockQuantity,
        stockAlertDate: parsed.data.stockAlertDate ? new Date(parsed.data.stockAlertDate) : undefined,
        instructions: parsed.data.instructions,
        isActive: true,
      },
    });
    return created(medication);
  })();
}
