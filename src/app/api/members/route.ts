import { prisma } from '@/lib/prisma';
import { createMemberSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const members = await prisma.member.findMany({ where: { userId }, take: QUERY_LIMITS.MEMBERS });
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

    const body = await request.json();
    const parsed = createMemberSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const member = await prisma.member.create({
      data: {
        userId,
        name: parsed.data.name,
        memberType: parsed.data.memberType ?? 'human',
        petType: parsed.data.petType,
        birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined,
        notes: parsed.data.notes,
      },
    });
    return created(member);
  })();
}
