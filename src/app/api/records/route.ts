import { prisma } from '@/lib/prisma';
import { createRecordSchema } from '@/lib/schemas';
import { getAuthUserId, success, created, errorResponse, unauthorized } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const records = await prisma.medicationRecord.findMany({
      where: { userId },
      orderBy: { takenAt: 'desc' },
      take: 50,
    });
    return success(records);
  } catch {
    return errorResponse('一覧取得に失敗しました', 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const parsed = createRecordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const record = await prisma.medicationRecord.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        medicationId: parsed.data.medicationId,
        scheduleId: parsed.data.scheduleId,
        notes: parsed.data.notes,
        dosageAmount: parsed.data.dosageAmount,
      },
    });
    return created(record);
  } catch {
    return errorResponse('登録に失敗しました', 500);
  }
}
