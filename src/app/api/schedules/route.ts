import { prisma } from '@/lib/prisma';
import { createScheduleSchema } from '@/lib/schemas';
import { getAuthUserId, success, created, errorResponse, unauthorized } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const schedules = await prisma.schedule.findMany({ where: { userId } });
    return success(schedules);
  } catch {
    return errorResponse('一覧取得に失敗しました', 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const body = await request.json();
    const parsed = createScheduleSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        medicationId: parsed.data.medicationId,
        memberId: parsed.data.memberId,
        scheduledTime: parsed.data.scheduledTime,
        daysOfWeek: parsed.data.daysOfWeek ?? [],
        isEnabled: parsed.data.isEnabled ?? true,
        reminderMinutesBefore: parsed.data.reminderMinutesBefore ?? 5,
      },
    });
    return created(schedule);
  } catch {
    return errorResponse('登録に失敗しました', 500);
  }
}
