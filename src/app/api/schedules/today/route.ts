import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`schedules-today-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [schedules, todayRecords, members] = await Promise.all([
    prisma.schedule.findMany({
      where: { userId, isEnabled: true },
      include: {
        medication: { select: { id: true, name: true, displayOrder: true } },
      },
      take: QUERY_LIMITS.SCHEDULES,
    }),
    prisma.medicationRecord.findMany({
      where: { userId, takenAt: { gte: todayStart, lte: todayEnd } },
      select: { scheduleId: true, medicationId: true },
      take: QUERY_LIMITS.RECORDS,
    }),
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true, memberType: true },
      take: QUERY_LIMITS.MEMBERS,
    }),
  ]);

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const completedScheduleIds = new Set(
    todayRecords.map((r) => r.scheduleId).filter(Boolean)
  );
  const completedMedicationIds = new Set(
    todayRecords.map((r) => r.medicationId).filter(Boolean)
  );

  const result = schedules.map((s) => {
    const member = memberMap.get(s.memberId);
    return {
      id: s.id,
      medicationId: s.medicationId,
      medicationName: s.medication.name,
      userId: s.userId,
      memberId: s.memberId,
      memberName: member?.name || '',
      memberType: member?.memberType || 'human',
      scheduledTime: s.scheduledTime,
      daysOfWeek: s.daysOfWeek,
      intervalDays: s.intervalDays,
      startDate: s.startDate?.toISOString(),
      isEnabled: s.isEnabled,
      reminderMinutesBefore: s.reminderMinutesBefore,
      medicationDisplayOrder: s.medication.displayOrder ?? 0,
      isCompleted: completedScheduleIds.has(s.id) || completedMedicationIds.has(s.medicationId),
      createdAt: s.createdAt.toISOString(),
    };
  });

  return success(result);
});
