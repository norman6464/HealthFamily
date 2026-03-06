import { prisma } from '@/lib/prisma';
import { updateMemberSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const findMember = (id: string) => prisma.member.findUnique({ where: { id } });

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { memberId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: memberId,
      finder: findMember,
      resourceName: 'メンバー',
      handler: async (member) => success(member),
    });
  })();
}

export async function PUT(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`members-put:${userId}`, { maxRequests: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { memberId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: memberId,
      finder: findMember,
      resourceName: 'メンバー',
      handler: async () => {
        const body = await request.json();
        const parsed = updateMemberSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const data: Record<string, unknown> = {};
        if (parsed.data.name !== undefined) data.name = parsed.data.name;
        if (parsed.data.petType !== undefined) data.petType = parsed.data.petType;
        if (parsed.data.birthDate !== undefined) {
          data.birthDate = parsed.data.birthDate ? new Date(parsed.data.birthDate) : null;
        }
        if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

        const updated = await prisma.member.update({
          where: { id: memberId },
          data,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`members-delete:${userId}`, { maxRequests: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { memberId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: memberId,
      finder: findMember,
      resourceName: 'メンバー',
      handler: async () => {
        await prisma.member.delete({ where: { id: memberId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
