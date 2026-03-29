import { createVaccinationSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetVaccinations, CreateVaccination } from '@/domain/usecases/ManageVaccinations';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`vaccinations-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetVaccinations(container.vaccinationRepository);
  const vaccinations = await usecase.execute();
  return success(vaccinations);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`vaccinations-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createVaccinationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new CreateVaccination(container.vaccinationRepository);
    const vaccination = await usecase.execute({
      memberId: parsed.data.memberId,
      vaccineName: parsed.data.vaccineName,
      vaccinatedAt: parsed.data.vaccinatedAt,
      nextScheduledDate: parsed.data.nextScheduledDate,
      notes: parsed.data.notes,
    });
    return created(vaccination);
  })();
}
