import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetSchedules } from '@/domain/usecases/ManageSchedules';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-all-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const container = createServerDIContainer(userId);
  const usecase = new GetSchedules(container.scheduleRepository);
  const schedulesWithDetails = await usecase.execute();

  const result = schedulesWithDetails.map((item) => ({
    id: item.schedule.id,
    medicationId: item.schedule.medicationId,
    medicationName: item.medicationName,
    userId: item.schedule.userId,
    memberId: item.schedule.memberId,
    memberName: item.memberName,
    scheduledTime: item.schedule.scheduledTime,
    daysOfWeek: item.schedule.daysOfWeek,
    intervalDays: item.schedule.intervalDays,
    startDate: item.schedule.startDate instanceof Date ? item.schedule.startDate.toISOString() : item.schedule.startDate,
    isEnabled: item.schedule.isEnabled,
    reminderMinutesBefore: item.schedule.reminderMinutesBefore,
    createdAt: item.schedule.createdAt instanceof Date ? item.schedule.createdAt.toISOString() : item.schedule.createdAt,
  }));

  return success(result);
});
