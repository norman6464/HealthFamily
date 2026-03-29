import { createAllergySchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetAllergies, CreateAllergy } from '@/domain/usecases/ManageAllergies';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`allergies-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetAllergies(container.allergyRepository);
  const allergies = await usecase.execute();
  return success(allergies);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`allergies-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createAllergySchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new CreateAllergy(container.allergyRepository);
    const allergy = await usecase.execute({
      memberId: parsed.data.memberId,
      allergenName: parsed.data.allergenName,
      allergyType: parsed.data.allergyType,
      severity: parsed.data.severity,
      symptoms: parsed.data.symptoms,
      diagnosedAt: parsed.data.diagnosedAt,
      notes: parsed.data.notes,
    });
    return created(allergy);
  })();
}
