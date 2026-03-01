import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth, validateParamId } from '@/lib/api-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { memberId } = await params;
    const idError = validateParamId(memberId);
    if (idError) return idError;
    const medications = await prisma.medication.findMany({ where: { memberId, userId }, take: 200 });
    return success(medications);
  })();
}
