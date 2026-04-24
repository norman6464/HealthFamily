import { success, errorResponse, notFound } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { getDrugInfo } from '@/lib/external/keggApi';

const KEGG_DRUG_ID_PATTERN = /^D\d{5}$/i;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withAuth(async (userId) => {
    const { allowed } = checkRateLimit(`medication-info-detail:${userId}`, {
      maxAttempts: 30,
      windowMs: 60 * 1000,
    });
    if (!allowed) {
      return errorResponse('リクエストが多すぎます。しばらくしてから再試行してください。', 429);
    }

    const { id } = await context.params;
    if (!id || !KEGG_DRUG_ID_PATTERN.test(id)) {
      return errorResponse('無効な薬剤IDです');
    }

    try {
      const info = await getDrugInfo(id);
      if (!info) return notFound('薬剤情報');
      return success({ ...info, source: 'kegg' as const });
    } catch (error) {
      console.error('[KEGG] detail fetch failed:', error);
      return errorResponse('薬剤情報の取得に失敗しました。時間をおいて再試行してください。', 502);
    }
  })();
}
