import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return withAuth(async (userId) => {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return errorResponse('検索キーワードを入力してください');
    }

    const medications = await prisma.medication.findMany({
      where: {
        userId,
        isActive: true,
        name: { contains: q, mode: 'insensitive' },
      },
      include: { member: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      take: 20,
    });

    const results = medications.map((med) => ({
      id: med.id,
      name: med.name,
      category: med.category,
      memberId: med.memberId,
      memberName: med.member.name,
      dosageAmount: med.dosageAmount,
      frequency: med.frequency,
      stockQuantity: med.stockQuantity,
    }));

    return success(results);
  })();
}
