import { prisma } from '@/lib/prisma';
import { createScheduleSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership } from '@/lib/api-helpers';
import { ScheduleEntity, Schedule } from '@/domain/entities/Schedule';

export const GET = withAuth(async (userId) => {
  const schedules = await prisma.schedule.findMany({ where: { userId }, take: 200 });
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

    const daysOfWeek = parsed.data.daysOfWeek ?? [];

    // ドメインエンティティによる重複チェック
    const existing = await prisma.schedule.findFirst({
      where: {
        userId,
        medicationId: parsed.data.medicationId,
        scheduledTime: parsed.data.scheduledTime,
        isEnabled: true,
      },
    });

    if (existing) {
      const newScheduleData: Schedule = {
        id: '',
        medicationId: parsed.data.medicationId,
        userId,
        memberId: parsed.data.memberId,
        scheduledTime: parsed.data.scheduledTime,
        daysOfWeek: daysOfWeek as Schedule['daysOfWeek'],
        isEnabled: true,
        reminderMinutesBefore: parsed.data.reminderMinutesBefore ?? 5,
        createdAt: new Date(),
      };
      const entity = new ScheduleEntity(newScheduleData);
      const existingSchedule: Schedule = { ...existing, daysOfWeek: existing.daysOfWeek as Schedule['daysOfWeek'] };
      if (entity.hasOverlap(existingSchedule)) {
        return errorResponse('同じ薬の同じ時刻に既にスケジュールが存在します');
      }
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
