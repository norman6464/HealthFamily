import { NextRequest } from 'next/server';
import { success, errorResponse } from '@/lib/auth-helpers';
import { withAuth } from '@/lib/api-helpers';
import { checkRateLimit } from '@/lib/security';
import { createServerDIContainer } from '@/infrastructure/ServerDIContainer';
import { SearchMedications } from '@/domain/usecases/ManageMedications';

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

    const container = createServerDIContainer(userId);
    const usecase = new SearchMedications(container.medicationRepository);
    const results = await usecase.execute(q);

    return success(results);
  })();
}
