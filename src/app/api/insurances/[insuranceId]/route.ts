import { prisma } from '@/lib/prisma';
import { updateInsuranceSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateInsurance, DeleteInsurance } from '@/domain/usecases/ManageInsurances';

const findInsurance = (id: string) => prisma.insurance.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ insuranceId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`insurances-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { insuranceId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: insuranceId,
      finder: findInsurance,
      resourceName: '保険',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updateInsuranceSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const container = createServerDIContainer(userId);
        const usecase = new UpdateInsurance(container.insuranceRepository);
        const updated = await usecase.execute(insuranceId, {
          insuranceType: parsed.data.insuranceType,
          providerName: parsed.data.providerName,
          policyNumber: parsed.data.policyNumber,
          notes: parsed.data.notes,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ insuranceId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`insurances-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { insuranceId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: insuranceId,
      finder: findInsurance,
      resourceName: '保険',
      handler: async () => {
        const container = createServerDIContainer(userId);
        const usecase = new DeleteInsurance(container.insuranceRepository);
        await usecase.execute(insuranceId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
