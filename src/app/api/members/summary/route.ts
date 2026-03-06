import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`members-summary-get:${userId}`, { maxRequests: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const [members, medications, appointments] = await Promise.all([
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true, memberType: true },
      take: QUERY_LIMITS.MEMBERS,
    }),
    prisma.medication.findMany({
      where: { userId, isActive: true },
      select: { memberId: true },
      take: QUERY_LIMITS.SCHEDULES,
    }),
    prisma.appointment.findMany({
      where: { userId, appointmentDate: { gte: new Date() } },
      select: { memberId: true, appointmentDate: true },
      orderBy: { appointmentDate: 'asc' },
      take: QUERY_LIMITS.APPOINTMENTS,
    }),
  ]);

  const summary = members.map((member) => {
    const medicationCount = medications.filter((m) => m.memberId === member.id).length;
    const nextAppointment = appointments.find((a) => a.memberId === member.id);

    return {
      memberId: member.id,
      memberName: member.name,
      memberType: member.memberType,
      medicationCount,
      nextAppointmentDate: nextAppointment?.appointmentDate.toISOString() ?? null,
    };
  });

  return success(summary);
});
