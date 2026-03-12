import { prisma } from '@/lib/prisma';
import { createMedicationSchema } from '@/lib/schemas';
import { created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize , safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const rateLimit = checkRateLimit(`medications:${userId}`, { maxAttempts: 10, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('作成回数の上限に達しました。しばらくしてから再試行してください。', 429);
    }

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
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

    await prisma.schedule.create({
      data: {
        userId,
        medicationId: medication.id,
        memberId: parsed.data.memberId,
        scheduledTime: '08:00',
        daysOfWeek: [],
        isEnabled: true,
        reminderMinutesBefore: 5,
      },
    });

    return created(medication);
  })();
}
