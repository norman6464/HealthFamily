import { prisma } from '@/lib/prisma';
import { createScheduleSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const schedules = await prisma.schedule.findMany({ where: { userId } });
  return success(schedules);
});

export async function POST(request: Request) {
  return withAuth(async (userId) => {
    const body = await request.json();
    const parsed = createScheduleSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
      { finder: () => prisma.medication.findUnique({ where: { id: parsed.data.medicationId } }), resourceName: '薬' },
    ]);
    if (ownershipError) return ownershipError;

    // 重複チェック: 同じ薬・同じ時刻・曜日が重複するスケジュール
    const daysOfWeek = parsed.data.daysOfWeek ?? [];
    const existing = await prisma.schedule.findFirst({
      where: {
        userId,
        medicationId: parsed.data.medicationId,
        scheduledTime: parsed.data.scheduledTime,
        isEnabled: true,
      },
    });

    if (existing && daysOfWeek.length > 0) {
      const overlapping = daysOfWeek.some((day) => existing.daysOfWeek.includes(day));
      if (overlapping) {
        return errorResponse('同じ薬の同じ時刻に既にスケジュールが存在します');
      }
    } else if (existing && daysOfWeek.length === 0) {
      return errorResponse('同じ薬の同じ時刻に既にスケジュールが存在します');
    }

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        medicationId: parsed.data.medicationId,
        memberId: parsed.data.memberId,
        scheduledTime: parsed.data.scheduledTime,
        daysOfWeek,
        isEnabled: parsed.data.isEnabled ?? true,
        reminderMinutesBefore: parsed.data.reminderMinutesBefore ?? 5,
      },
    });
    return created(schedule);
  })();
}
