import { prisma } from '@/lib/prisma';
import { updateAppointmentSchema } from '@/lib/schemas';
import { getAuthUserId, success, errorResponse, notFound, unauthorized } from '@/lib/auth-helpers';

export async function PUT(request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { appointmentId } = await params;
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment || appointment.userId !== userId) return notFound('予約');

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
  } catch {
    return errorResponse('更新に失敗しました', 500);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const userId = await getAuthUserId();
    if (!userId) return unauthorized();

    const { appointmentId } = await params;
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment || appointment.userId !== userId) return notFound('予約');

    await prisma.appointment.delete({ where: { id: appointmentId } });
    return success({ message: '削除しました' });
  } catch {
    return errorResponse('削除に失敗しました', 500);
  }
}
