import { prisma } from '@/lib/prisma';
import { createAppointmentSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export const GET = withAuth(async (userId) => {
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    orderBy: { appointmentDate: 'asc' },
    include: {
      member: { select: { name: true } },
      hospital: { select: { name: true } },
    },
  });
  const result = appointments.map((a) => ({
    ...a,
    memberName: a.member.name,
    hospitalName: a.hospital?.name,
    member: undefined,
    hospital: undefined,
  }));
  return success(result);
});

export async function POST(request: Request) {
  return withAuth(async (userId) => {
    const body = await request.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const appointment = await prisma.appointment.create({
      data: {
        userId,
        memberId: parsed.data.memberId,
        hospitalId: parsed.data.hospitalId,
        appointmentType: parsed.data.type,
        appointmentDate: new Date(parsed.data.appointmentDate),
        description: parsed.data.notes,
        reminderEnabled: parsed.data.reminderEnabled ?? true,
        reminderDaysBefore: parsed.data.reminderDaysBefore ?? 1,
      },
    });
    return created(appointment);
  })();
}
