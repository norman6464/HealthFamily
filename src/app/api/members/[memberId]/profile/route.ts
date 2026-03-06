import { prisma } from '@/lib/prisma';
import { success, notFound, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { DateRangeHelper } from '@/domain/entities/DateRange';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`member-profile-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { memberId } = await params;
    const idError = validateParamId(memberId);
    if (idError) return idError;

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member || member.userId !== userId) return notFound('メンバー');

    const [medicationCount, activeScheduleCount, upcomingAppointmentCount] = await Promise.all([
      prisma.medication.count({ where: { memberId, userId, isActive: true } }),
      prisma.schedule.count({ where: { memberId, userId, isEnabled: true } }),
      prisma.appointment.count({
        where: { memberId, userId, appointmentDate: { gte: new Date() } },
      }),
    ]);

    const sevenDaysAgo = DateRangeHelper.daysAgo(7);

    const [recordCount, scheduleCount] = await Promise.all([
      prisma.medicationRecord.count({ where: { memberId, userId, takenAt: { gte: sevenDaysAgo } } }),
      prisma.schedule.count({ where: { memberId, userId, isEnabled: true } }),
    ]);

    const expectedRecords = scheduleCount * 7;
    const recentAdherenceRate = expectedRecords > 0
      ? Math.round((recordCount / expectedRecords) * 100)
      : null;

    return success({
      member,
      medicationCount,
      activeScheduleCount,
      upcomingAppointmentCount,
      recentAdherenceRate,
    });
  })();
}
