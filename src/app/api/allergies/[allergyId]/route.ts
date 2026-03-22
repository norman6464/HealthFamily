import { prisma } from '@/lib/prisma';
import { updateAllergySchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateAllergy, DeleteAllergy } from '@/domain/usecases/ManageAllergies';

const findAllergy = (id: string) => prisma.allergy.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ allergyId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`allergies-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { allergyId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: allergyId,
      finder: findAllergy,
      resourceName: 'アレルギー',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updateAllergySchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const container = createServerDIContainer(userId);
        const usecase = new UpdateAllergy(container.allergyRepository);
        const updated = await usecase.execute(allergyId, {
          allergenName: parsed.data.allergenName,
          allergyType: parsed.data.allergyType,
          severity: parsed.data.severity,
          symptoms: parsed.data.symptoms,
          diagnosedAt: parsed.data.diagnosedAt,
          notes: parsed.data.notes,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ allergyId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`allergies-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { allergyId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: allergyId,
      finder: findAllergy,
      resourceName: 'アレルギー',
      handler: async () => {
        const container = createServerDIContainer(userId);
        const usecase = new DeleteAllergy(container.allergyRepository);
        await usecase.execute(allergyId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
