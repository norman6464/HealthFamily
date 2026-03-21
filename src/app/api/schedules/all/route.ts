import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-all-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

  const [schedules, members] = await Promise.all([
    prisma.schedule.findMany({
      where: { userId },
      include: {
        medication: { select: { id: true, name: true } },
      },
      take: QUERY_LIMITS.SCHEDULES,
    }),
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true },
      take: QUERY_LIMITS.MEMBERS,
    }),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const result = schedules.map((s) => ({
    id: s.id,
    medicationId: s.medicationId,
    medicationName: s.medication.name,
    userId: s.userId,
    memberId: s.memberId,
    memberName: memberMap.get(s.memberId)?.name || '',
    scheduledTime: s.scheduledTime,
    daysOfWeek: s.daysOfWeek,
    intervalDays: s.intervalDays,
    startDate: s.startDate?.toISOString(),
    isEnabled: s.isEnabled,
    reminderMinutesBefore: s.reminderMinutesBefore,
    createdAt: s.createdAt.toISOString(),
  }));

  return success(result);
});
