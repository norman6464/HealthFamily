import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth, validateParamId } from '@/lib/api-helpers';
import { QUERY_LIMITS } from '@/lib/constants';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { memberId } = await params;
    const idError = validateParamId(memberId);
    if (idError) return idError;
    const medications = await prisma.medication.findMany({ where: { memberId, userId }, take: QUERY_LIMITS.APPOINTMENTS });
    return success(medications);
  })();
}
