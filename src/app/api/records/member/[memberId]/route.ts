import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`records-member-get:${userId}`, { maxRequests: 30, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { memberId } = await params;
    const idError = validateParamId(memberId);
    if (idError) return idError;
    const records = await prisma.medicationRecord.findMany({
      where: { memberId, userId },
      orderBy: { takenAt: 'desc' },
      take: QUERY_LIMITS.DEFAULT,
    });
    return success(records);
  })();
}
