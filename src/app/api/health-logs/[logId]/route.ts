import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth, withOwnershipCheck } from '@/lib/api-helpers';

export async function DELETE(_request: Request, { params }: { params: Promise<{ logId: string }> }) {
  return withAuth(async (userId) => {
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
