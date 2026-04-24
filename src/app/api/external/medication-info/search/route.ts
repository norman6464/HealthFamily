import { NextRequest } from 'next/server';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { searchDrugsByName } from '@/lib/external/keggApi';

export async function GET(request: NextRequest) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medication-info-search:${userId}`, {
      maxAttempts: 20,
      windowMs: 60 * 1000,
    });
    if (!allowed) {
      return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    }

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) return errorResponse('検索キーワードを入力してください');
    if (q.length > 100) return errorResponse('検索キーワードは100文字以内で入力してください');

    try {
      const results = await searchDrugsByName(q);
      return success(results);
    } catch (error) {
      console.error('[KEGG] search failed:', error);
      return errorResponse('薬剤情報の検索に失敗しました。時間をおいて再試行してください。', 502);
    }
  })();
}
