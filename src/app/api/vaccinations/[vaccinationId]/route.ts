import { updateVaccinationSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateVaccination, DeleteVaccination } from '@/domain/usecases/ManageVaccinations';

export async function PUT(request: Request, { params }: { params: Promise<{ vaccinationId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`vaccinations-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const container = createServerDIContainer(userId);
    const { vaccinationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: vaccinationId,
      finder: (id) => container.vaccinationRepository.findById(id),
      resourceName: 'ワクチン記録',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updateVaccinationSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const usecase = new UpdateVaccination(container.vaccinationRepository);
        const updated = await usecase.execute(vaccinationId, {
          vaccineName: parsed.data.vaccineName,
          vaccinatedAt: parsed.data.vaccinatedAt,
          nextScheduledDate: parsed.data.nextScheduledDate,
          notes: parsed.data.notes,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ vaccinationId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`vaccinations-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const container = createServerDIContainer(userId);
    const { vaccinationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: vaccinationId,
      finder: (id) => container.vaccinationRepository.findById(id),
      resourceName: 'ワクチン記録',
      handler: async () => {
        const usecase = new DeleteVaccination(container.vaccinationRepository);
        await usecase.execute(vaccinationId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
