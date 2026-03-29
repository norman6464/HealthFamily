import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`records-member-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const { memberId } = await params;
    const idError = validateParamId(memberId);
    if (idError) return idError;

    const container = createServerDIContainer(userId);
    const records = await container.medicationRecordRepository.getHistoryByMember(memberId);

    return success(records);
  })();
}
