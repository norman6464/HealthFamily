import { updateAppointmentSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { UpdateAppointment, DeleteAppointment } from '@/domain/usecases/ManageAppointments';

export async function PUT(request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`appointments-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const container = createServerDIContainer(userId);
    const { appointmentId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: appointmentId,
      finder: (id) => container.appointmentRepository.getAppointmentById(id),
      resourceName: '予約',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
        const parsed = updateAppointmentSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const usecase = new UpdateAppointment(container.appointmentRepository);
        const updated = await usecase.execute(appointmentId, {
          appointmentDate: parsed.data.appointmentDate,
          hospitalId: parsed.data.hospitalId === '' ? undefined : (parsed.data.hospitalId ?? undefined),
          type: parsed.data.type,
          notes: parsed.data.notes,
          reminderEnabled: parsed.data.reminderEnabled,
          reminderDaysBefore: parsed.data.reminderDaysBefore,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`appointments-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const container = createServerDIContainer(userId);
    const { appointmentId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: appointmentId,
      finder: (id) => container.appointmentRepository.getAppointmentById(id),
      resourceName: '予約',
      handler: async () => {
        const usecase = new DeleteAppointment(container.appointmentRepository);
        await usecase.execute(appointmentId);
        return success({ message: '削除しました' });
      },
    });
  })();
}
