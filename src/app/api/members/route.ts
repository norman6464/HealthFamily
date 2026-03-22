import { createMemberSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetMembers, CreateMember } from '@/domain/usecases/ManageMembers';
import { CreateMemberInput } from '@/domain/repositories/MemberRepository';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`members-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetMembers(container.memberRepository);
  const members = await usecase.execute(userId);
  return success(members);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const rateLimit = checkRateLimit(`members:${userId}`, { maxAttempts: 10, windowMs: 60 * 1000 });
    if (!rateLimit.allowed) {
      return errorResponse('作成回数の上限に達しました。しばらくしてから再試行してください。', 429);
    }

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new CreateMember(container.memberRepository);
    const member = await usecase.execute({
      userId,
      name: parsed.data.name,
      memberType: parsed.data.memberType ?? 'human',
      petType: parsed.data.petType as CreateMemberInput['petType'],
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined,
      notes: parsed.data.notes,
    });
    return created(member);
  })();
}
