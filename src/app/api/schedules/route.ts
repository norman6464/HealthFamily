import { createScheduleSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { CreateSchedule } from '@/domain/usecases/ManageSchedules';
import { DayOfWeek } from '@/domain/entities/Schedule';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const container = createServerDIContainer(userId);
  const schedules = await container.scheduleRepository.getSchedulesRaw();
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

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId), resourceName: 'メンバー' },
      { finder: () => container.medicationRepository.getMedicationById(parsed.data.medicationId), resourceName: '薬' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new CreateSchedule(container.scheduleRepository);

    try {
      const schedule = await usecase.execute({
        medicationId: parsed.data.medicationId,
        userId,
        memberId: parsed.data.memberId,
        scheduledTime: parsed.data.scheduledTime,
        daysOfWeek: (parsed.data.daysOfWeek ?? []) as DayOfWeek[],
        intervalDays: parsed.data.intervalDays ?? undefined,
        startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
        isEnabled: parsed.data.isEnabled ?? true,
        reminderMinutesBefore: parsed.data.reminderMinutesBefore ?? 5,
      });
      return created(schedule);
    } catch (error) {
      if (error instanceof Error && error.message === '同じ薬の同じ時刻に既にスケジュールが存在します') {
        return errorResponse(error.message);
      }
      throw error;
    }
  })();
}
