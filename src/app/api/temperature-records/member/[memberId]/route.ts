import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth, verifyResourceOwnership, validateParamId } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { GetTemperatureRecordsByMember } from '@/domain/usecases/ManageTemperatureRecords';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`temperature-records-member-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);

    const { memberId } = await params;
    const idError = validateParamId(memberId);
    if (idError) return idError;

    const container = createServerDIContainer(userId);
    const ownershipError = await verifyResourceOwnership(userId, [
      { finder: () => container.memberRepository.getMemberById(memberId), resourceName: 'メンバー' },
    ]);
    if (ownershipError) return ownershipError;

    const usecase = new GetTemperatureRecordsByMember(container.temperatureRecordRepository);
    const records = await usecase.execute(memberId);
    return success(records);
  })();
}
