import { createPrescriptionSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetPrescriptions, CreatePrescription } from '@/domain/usecases/ManagePrescriptions';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`prescriptions-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetPrescriptions(container.prescriptionRepository);
  const prescriptions = await usecase.execute();
  return success(prescriptions);
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

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new CreatePrescription(container.prescriptionRepository);
    const prescription = await usecase.execute({
      memberId: parsed.data.memberId,
      prescriptionName: parsed.data.prescriptionName,
      prescribedBy: parsed.data.prescribedBy,
      prescribedAt: parsed.data.prescribedAt,
      expiresAt: parsed.data.expiresAt,
      pharmacyName: parsed.data.pharmacyName,
      notes: parsed.data.notes,
    });
    return created(prescription);
  })();
}
