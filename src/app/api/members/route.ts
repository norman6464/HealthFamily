import { prisma } from '@/lib/prisma';
import { createMemberSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const members = await prisma.member.findMany({ where: { userId }, take: 100 });
  return success(members);
});

export async function POST(request: Request) {
  return withAuth(async (userId) => {
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
