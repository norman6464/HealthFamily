import { updateMedicationSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateMedication, DeleteMedication } from '@/domain/usecases/ManageMedications';

export async function GET(_request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { medicationId } = await params;
    const idError = validateParamId(medicationId);
    if (idError) return idError;

    const container = createServerDIContainer(userId);
    const medication = await container.medicationRepository.getMedicationById(medicationId);
    if (!medication) return errorResponse('お薬が見つかりません', 404);

    return success(medication);
  })();
}

export async function PUT(request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { medicationId } = await params;
    const idError = validateParamId(medicationId);
    if (idError) return idError;

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = updateMedicationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new UpdateMedication(container.medicationRepository);

    try {
      const updated = await usecase.execute(medicationId, {
        name: parsed.data.name,
        category: parsed.data.category,
        dosage: parsed.data.dosageAmount,
        frequency: parsed.data.frequency,
        stockQuantity: parsed.data.stockQuantity,
        stockAlertDate: parsed.data.stockAlertDate,
        instructions: parsed.data.instructions,
        isActive: parsed.data.isActive,
      });
      return success(updated);
    } catch (error) {
      if (error instanceof Error && error.message === '薬が見つかりません') {
        return errorResponse('お薬が見つかりません', 404);
      }
      throw error;
    }
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ medicationId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { medicationId } = await params;
    const idError = validateParamId(medicationId);
    if (idError) return idError;

    const container = createServerDIContainer(userId);
    const usecase = new DeleteMedication(container.medicationRepository);

    try {
      await usecase.execute(medicationId);
      return success({ message: '削除しました' });
    } catch (error) {
      if (error instanceof Error && error.message === '薬が見つかりません') {
        return errorResponse('お薬が見つかりません', 404);
      }
      throw error;
    }
  })();
}
