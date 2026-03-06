import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

const findRecord = (id: string) => prisma.medicationRecord.findUnique({ where: { id } });

export async function DELETE(_request: Request, { params }: { params: Promise<{ recordId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`records-delete:${userId}`, { maxRequests: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { recordId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: recordId,
      finder: findRecord,
      resourceName: '服薬記録',
      handler: async () => {
        await prisma.medicationRecord.delete({ where: { id: recordId } });
        return success({ message: '削除しました' });
      },
    });
  })();
}
