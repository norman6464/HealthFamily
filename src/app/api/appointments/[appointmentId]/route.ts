import { prisma } from '@/lib/prisma';
import { updateAppointmentSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';

const findAppointment = (id: string) => prisma.appointment.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  return withAuth(async (userId) => {
    const { appointmentId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: appointmentId,
      finder: findAppointment,
      resourceName: '予約',
      handler: async () => {
        const body = await request.json();
        const parsed = updateAppointmentSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const updated = await prisma.appointment.update({
          where: { id: appointmentId },
          data: {
            appointmentDate: parsed.data.appointmentDate ? new Date(parsed.data.appointmentDate) : undefined,
            appointmentType: parsed.data.type,
            description: parsed.data.notes,
            reminderEnabled: parsed.data.reminderEnabled,
            reminderDaysBefore: parsed.data.reminderDaysBefore,
          },
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  return withAuth(async (userId) => {
    const { appointmentId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: appointmentId,
      finder: findAppointment,
      resourceName: '予約',
      handler: async () => {
        await prisma.appointment.delete({ where: { id: appointmentId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
