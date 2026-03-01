import { prisma } from '@/lib/prisma';
import { updateMemberSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';

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
  return withAuth(async (userId) => {
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
