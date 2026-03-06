import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';

export async function DELETE(_request: Request, { params }: { params: Promise<{ logId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`health-logs-delete:${userId}`, { maxRequests: 10, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { logId } = await params;
    return withOwnershipCheck({
      userId,
      resourceId: logId,
      finder: (id) => prisma.healthLog.findUnique({ where: { id } }),
      resourceName: '体調記録',
      handler: async (log) => {
        await prisma.healthLog.delete({ where: { id: log.id } });
        return success({ deleted: true });
      },
    });
  })();
}
