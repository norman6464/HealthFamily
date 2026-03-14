import { prisma } from '@/lib/prisma';
import { updateExaminationSchema } from '@/lib/schemas';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck, validateBodySize, safeParseJson } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const findExamination = (id: string) => prisma.examination.findUnique({ where: { id } });

export async function PUT(request: Request, { params }: { params: Promise<{ examinationId: string }> }) {
  const sizeError = validateBodySize(request);
  if (sizeError) return sizeError;

  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`examinations-put:${userId}`, { maxAttempts: 20, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { examinationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: examinationId,
      finder: findExamination,
      resourceName: '検査記録',
      handler: async () => {
        const jsonResult = await safeParseJson(request);
        if ('error' in jsonResult) return jsonResult.error;
        const body = jsonResult.data;
        const parsed = updateExaminationSchema.safeParse(body);
        if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

        const updated = await prisma.examination.update({
          where: { id: examinationId },
          data: {
            examinationType: parsed.data.examinationType,
            examinedAt: parsed.data.examinedAt ? new Date(parsed.data.examinedAt) : undefined,
            nextScheduledDate: parsed.data.nextScheduledDate ? new Date(parsed.data.nextScheduledDate) : parsed.data.nextScheduledDate === null ? null : undefined,
            notes: parsed.data.notes,
          },
        });
        return success(updated);
      },
    });
  })();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ examinationId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`examinations-delete:${userId}`, { maxAttempts: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { examinationId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: examinationId,
      finder: findExamination,
      resourceName: '検査記録',
      handler: async () => {
        await prisma.examination.delete({ where: { id: examinationId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
