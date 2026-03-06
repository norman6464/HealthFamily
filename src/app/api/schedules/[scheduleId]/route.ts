import { prisma } from '@/lib/prisma';
import { updateScheduleSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize , safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const findSchedule = (id: string) => prisma.schedule.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`schedules-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { scheduleId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: scheduleId,
      finder: findSchedule,
      resourceName: 'スケジュール',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
    if ('error' in jsonResult) return jsonResult.error;
    const body = jsonResult.data;
        const parsed = updateScheduleSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const updated = await prisma.schedule.update({
          where: { id: scheduleId },
          data: parsed.data,
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ scheduleId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`schedules-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { scheduleId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: scheduleId,
      finder: findSchedule,
      resourceName: 'スケジュール',
      handler: async () => {
        await prisma.schedule.delete({ where: { id: scheduleId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
