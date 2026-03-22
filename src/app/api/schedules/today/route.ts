import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-today-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const container = createServerDIContainer(userId);
  const items = await container.scheduleRepository.getTodaySchedules({
    userId,
    date: new Date(),
  });

  const result = items.map((item) => ({
    id: item.schedule.id,
    medicationId: item.schedule.medicationId,
    medicationName: item.medicationName,
    userId: item.schedule.userId,
    memberId: item.schedule.memberId,
    memberName: item.memberName,
    memberType: item.memberType,
    scheduledTime: item.schedule.scheduledTime,
    daysOfWeek: item.schedule.daysOfWeek,
    intervalDays: item.schedule.intervalDays,
    startDate: item.schedule.startDate instanceof Date ? item.schedule.startDate.toISOString() : item.schedule.startDate,
    isEnabled: item.schedule.isEnabled,
    reminderMinutesBefore: item.schedule.reminderMinutesBefore,
    medicationDisplayOrder: item.medicationDisplayOrder,
    isCompleted: item.isCompleted,
    createdAt: item.schedule.createdAt instanceof Date ? item.schedule.createdAt.toISOString() : item.schedule.createdAt,
  }));

  return success(result);
});
