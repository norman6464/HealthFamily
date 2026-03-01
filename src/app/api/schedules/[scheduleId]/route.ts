import { prisma } from '@/lib/prisma';
import { updateScheduleSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';

const findSchedule = (id: string) => prisma.schedule.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  return withAuth(async (userId) => {
    const { scheduleId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: scheduleId,
      finder: findSchedule,
      resourceName: 'スケジュール',
      handler: async () => {
        const body = await request.json();
        const parsed = updateScheduleSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const updated = await prisma.schedule.update({
          where: { id: scheduleId },
          data: parsed.data,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  return withAuth(async (userId) => {
    const { scheduleId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: scheduleId,
      finder: findSchedule,
      resourceName: 'スケジュール',
      handler: async () => {
        await prisma.schedule.delete({ where: { id: scheduleId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
