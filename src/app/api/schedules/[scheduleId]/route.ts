import { prisma } from '@/lib/prisma';
import { updateScheduleSchema } from '@/lib/schemas';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function PUT(request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { scheduleId } = await params;
    const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.userId !== userId) return notFound('スケジュール');

    const body = await request.json();
    const parsed = updateScheduleSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: parsed.data,
    });
    return success(updated);
  } catch {
    return errorResponse('更新に失敗しました', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { scheduleId } = await params;
    const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!schedule || schedule.userId !== userId) return notFound('スケジュール');

    await prisma.schedule.delete({ where: { id: scheduleId } });
    return success({ message: '削除しました' });
  } catch {
    return errorResponse('削除に失敗しました', 500);
  }
}
