import { prisma } from '@/lib/prisma';
import { createInsuranceSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetInsurances, CreateInsurance } from '@/domain/usecases/ManageInsurances';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`insurances-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetInsurances(container.insuranceRepository);
  const insurances = await usecase.execute();
  return success(insurances);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`insurances-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createInsuranceSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const container = createServerDIContainer(userId);
    const usecase = new CreateInsurance(container.insuranceRepository);
    const insurance = await usecase.execute({
      memberId: parsed.data.memberId,
      insuranceType: parsed.data.insuranceType,
      providerName: parsed.data.providerName,
      policyNumber: parsed.data.policyNumber,
      notes: parsed.data.notes,
    });
    return created(insurance);
  })();
}
