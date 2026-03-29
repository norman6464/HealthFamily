import { updatePrescriptionSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdatePrescription, DeletePrescription } from '@/domain/usecases/ManagePrescriptions';

export async function PUT(request: Request, { params }: { params: Promise<{ prescriptionId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`prescriptions-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const container = createServerDIContainer(userId);
    const { prescriptionId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: prescriptionId,
      finder: (id) => container.prescriptionRepository.findById(id),
      resourceName: '処方箋',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updatePrescriptionSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const usecase = new UpdatePrescription(container.prescriptionRepository);
        const updated = await usecase.execute(prescriptionId, {
          prescriptionName: parsed.data.prescriptionName,
          prescribedBy: parsed.data.prescribedBy,
          prescribedAt: parsed.data.prescribedAt,
          expiresAt: parsed.data.expiresAt,
          pharmacyName: parsed.data.pharmacyName,
          notes: parsed.data.notes,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ prescriptionId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`prescriptions-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const container = createServerDIContainer(userId);
    const { prescriptionId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: prescriptionId,
      finder: (id) => container.prescriptionRepository.findById(id),
      resourceName: '処方箋',
      handler: async () => {
        const usecase = new DeletePrescription(container.prescriptionRepository);
        await usecase.execute(prescriptionId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
