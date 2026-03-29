import { createMedicationSchema } from '@/lib/schemas';
import { created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize , safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { CreateMedicationWithSchedule } from '@/domain/usecases/ManageMedications';

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

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId!), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new CreateMedicationWithSchedule(
      container.medicationRepository,
      container.scheduleRepository,
    );

    const medication = await usecase.execute({
      userId,
      memberId: parsed.data.memberId,
      name: parsed.data.name,
      category: (parsed.data.category as 'regular') ?? 'regular',
      dosage: parsed.data.dosageAmount,
      frequency: parsed.data.frequency,
      stockQuantity: parsed.data.stockQuantity,
      stockAlertDate: parsed.data.stockAlertDate,
      instructions: parsed.data.instructions,
    });

    return created(medication);
  })();
}
