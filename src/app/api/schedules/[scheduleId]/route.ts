import { updateScheduleSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateBodySize, safeParseJson, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateSchedule, DeleteSchedule } from '@/domain/usecases/ManageSchedules';
import { DayOfWeek } from '@/domain/entities/Schedule';

export async function PUT(request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`schedules-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { scheduleId } = await params;
    const idError = validateParamId(scheduleId);
    if (idError) return idError;

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = updateScheduleSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const usecase = new UpdateSchedule(container.scheduleRepository);

    const input: Record<string, unknown> = {};
    if (parsed.data.scheduledTime !== undefined) input.scheduledTime = parsed.data.scheduledTime;
    if (parsed.data.daysOfWeek !== undefined) input.daysOfWeek = parsed.data.daysOfWeek as DayOfWeek[];
    if (parsed.data.intervalDays !== undefined) input.intervalDays = parsed.data.intervalDays;
    if (parsed.data.startDate !== undefined) {
      input.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : undefined;
    }
    if (parsed.data.isEnabled !== undefined) input.isEnabled = parsed.data.isEnabled;
    if (parsed.data.reminderMinutesBefore !== undefined) input.reminderMinutesBefore = parsed.data.reminderMinutesBefore;

    const clearInterval = parsed.data.intervalDays === null;

    try {
      const updated = await usecase.execute(
        scheduleId,
        input,
        clearInterval ? { clearInterval: true } : undefined,
      );
      return success(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'スケジュールが見つかりません') {
        return errorResponse('スケジュールが見つかりません', 404);
      }
      throw error;
    }
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`schedules-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { scheduleId } = await params;
    const idError = validateParamId(scheduleId);
    if (idError) return idError;

    const container = createServerDIContainer(userId);
    const usecase = new DeleteSchedule(container.scheduleRepository);

    try {
      await usecase.execute(scheduleId);
      return success({ message: '削除しました' });
    } catch (error) {
      if (error instanceof Error && error.message === 'スケジュールが見つかりません') {
        return errorResponse('スケジュールが見つかりません', 404);
      }
      throw error;
    }
  })();
}
