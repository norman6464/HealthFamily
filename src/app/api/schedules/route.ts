import { prisma } from '@/lib/prisma';
import { createScheduleSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize , safeParseJson } from '@/lib/api-helpers';
import { ScheduleEntity, Schedule } from '@/domain/entities/Schedule';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const schedules = await prisma.schedule.findMany({ where: { userId }, take: QUERY_LIMITS.SCHEDULES });
  return success(schedules);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`schedules-post:${userId}`, { maxAttempts: 15, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
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
