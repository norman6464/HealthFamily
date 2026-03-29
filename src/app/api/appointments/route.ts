import { createAppointmentSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetAppointments, CreateAppointment } from '@/domain/usecases/ManageAppointments';

export const GET = withAuth(async (userId) => {
  const { allowed } = checkRateLimit(`appointments-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
  if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
  const container = createServerDIContainer(userId);
  const usecase = new GetAppointments(container.appointmentRepository);
  const appointments = await usecase.execute();
  return success(appointments);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`appointments-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const container = createServerDIContainer(userId);
    const checks: Parameters<typeof verifyResourceOwnership>[1] = [
      { finder: () => container.memberRepository.getMemberById(parsed.data.memberId), resourceName: 'メンバー' },
    ];
    if (parsed.data.hospitalId) {
      checks.push({
        finder: () => container.hospitalRepository.findById(parsed.data.hospitalId!),
        resourceName: '病院',
      });
    }
    const ownershipError = await verifyResourceOwnership(userId, checks);
    if (ownershipError) return ownershipError;

    const usecase = new CreateAppointment(container.appointmentRepository);
    const appointment = await usecase.execute({
      memberId: parsed.data.memberId,
      hospitalId: parsed.data.hospitalId,
      appointmentDate: parsed.data.appointmentDate,
      type: parsed.data.type,
      notes: parsed.data.notes,
      reminderEnabled: parsed.data.reminderEnabled ?? true,
      reminderDaysBefore: parsed.data.reminderDaysBefore ?? 1,
    });
    return created(appointment);
  })();
}
