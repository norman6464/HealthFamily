import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { QUERY_LIMITS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medications-search-get:${userId}`, { maxAttempts: 30, windowMs: 60000 });
    if (!allowed) return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return errorResponse('検索キーワードを入力してください');
    }
    if (q.length > 100) {
      return errorResponse('検索キーワードは100文字以内で入力してください');
    }

    const medications = await prisma.medication.findMany({
      where: {
        userId,
        isActive: true,
        name: { contains: q, mode: 'insensitive' },
      },
      include: { member: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
      take: QUERY_LIMITS.DEFAULT,
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
