import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const [members, medications, appointments] = await Promise.all([
    prisma.member.findMany({
      where: { userId },
      select: { id: true, name: true, memberType: true },
    }),
    prisma.medication.findMany({
      where: { userId, isActive: true },
      select: { memberId: true },
    }),
    prisma.appointment.findMany({
      where: { userId, appointmentDate: { gte: new Date() } },
      select: { memberId: true, appointmentDate: true },
      orderBy: { appointmentDate: 'asc' },
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
