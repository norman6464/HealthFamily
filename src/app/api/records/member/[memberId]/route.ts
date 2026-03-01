import { prisma } from '@/lib/prisma';
import { success } from '@/lib/auth-helpers';
import { withAuth, validateParamId } from '@/lib/api-helpers';

export async function GET(_request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  return withAuth(async (userId) => {
    const { memberId } = await params;
    const idError = validateParamId(memberId);
    if (idError) return idError;
    const records = await prisma.medicationRecord.findMany({
      where: { memberId, userId },
      orderBy: { takenAt: 'desc' },
      take: 50,
    });
    return success(records);
  })();
}
