import { prisma } from '@/lib/prisma';
import { createAppointmentSchema } from '@/lib/schemas';
import { success, created, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateBodySize, flattenRelations } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';
import { checkRateLimit } from '@/lib/security';

export const GET = withAuth(async (userId) => {
  const appointments = await prisma.appointment.findMany({
    where: { userId },
    orderBy: { appointmentDate: 'asc' },
    take: QUERY_LIMITS.APPOINTMENTS,
    include: {
      member: { select: { name: true } },
      hospital: { select: { name: true } },
    },
  });
  const result = appointments.map((a) =>
    flattenRelations(a, { member: 'memberName', hospital: 'hospitalName' }),
  );
  return success(result);
});

export async function POST(request: Request) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`appointments-post:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const body = await request.json();
    const parsed = createAppointmentSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const checks: Parameters<typeof verifyResourceOwnership>[1] = [
      { finder: () => prisma.member.findUnique({ where: { id: parsed.data.memberId } }), resourceName: 'メンバー' },
    ];
    if (parsed.data.hospitalId) {
      checks.push({
        finder: () => prisma.hospital.findUnique({ where: { id: parsed.data.hospitalId! } }),
        resourceName: '病院',
      });
    }
    const ownershipError = await verifyResourceOwnership(userId, checks);
    if (ownershipError) return ownershipError;

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
