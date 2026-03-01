import { prisma } from '@/lib/prisma';
import { createScheduleSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const schedules = await prisma.schedule.findMany({ where: { userId } });
  return success(schedules);
});

export async function POST(request: Request) {
  return withAuth(async (userId) => {
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
  })();
}
