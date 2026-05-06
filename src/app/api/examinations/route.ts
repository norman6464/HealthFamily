import { createExaminationSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetExaminations, CreateExamination } from '@/domain/usecases/ManageExaminations';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`examinations-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetExaminations(container.examinationRepository);
  const examinations = await usecase.execute();
  return success(examinations);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`examinations-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createExaminationSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new CreateExamination(container.examinationRepository);
    const examination = await usecase.execute({
      memberId: parsed.data.memberId,
      examinationType: parsed.data.examinationType,
      examinedAt: parsed.data.examinedAt,
      nextScheduledDate: parsed.data.nextScheduledDate,
      notes: parsed.data.notes,
      imageData: parsed.data.imageData ?? undefined,
    });
    return created(examination);
  })();
}
