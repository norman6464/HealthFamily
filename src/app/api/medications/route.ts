import { prisma } from '@/lib/prisma';
import { createMedicationSchema } from '@/lib/schemas';
import { getAuthUserId, created, errorResponse, unauthorized } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const parsed = createMedicationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const medication = await prisma.medication.create({
      data: {
        userId,
        memberId: parsed.data.memberId!,
        name: parsed.data.name,
        category: parsed.data.category ?? 'regular',
        dosageAmount: parsed.data.dosageAmount,
        frequency: parsed.data.frequency,
        stockQuantity: parsed.data.stockQuantity,
        lowStockThreshold: parsed.data.lowStockThreshold,
        instructions: parsed.data.instructions,
        isActive: true,
      },
    });
    return created(medication);
  } catch {
    return errorResponse('登録に失敗しました', 500);
  }
}
