import { prisma } from '@/lib/prisma';
import { createMemberSchema } from '@/lib/schemas';
import { getAuthUserId, success, created, errorResponse, unauthorized } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const members = await prisma.member.findMany({ where: { userId } });
    return success(members);
  } catch {
    return errorResponse('一覧取得に失敗しました', 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

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
  } catch {
    return errorResponse('登録に失敗しました', 500);
  }
}
