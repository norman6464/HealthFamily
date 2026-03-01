/**
 * APIルートハンドラー用ヘルパー関数
 * 認証チェック・所有権チェックの共通パターンを抽出
 */

import { getAuthUserId, unauthorized, errorResponse, notFound } from './auth-helpers';

type AuthHandler = (userId: string) => Promise<Response>;

export function withAuth(handler: AuthHandler): () => Promise<Response> {
  return async () => {
    try {
      const userId = await getAuthUserId();
      if (!userId) return unauthorized();
      return await handler(userId);
    } catch {
      return errorResponse('処理に失敗しました', 500);
    }
  };
}

interface WithOwnershipCheckOptions<T> {
  userId: string;
  resourceId: string;
  finder: (id: string) => Promise<T | null>;
  resourceName: string;
  handler: (resource: T) => Promise<Response>;
}

export async function withOwnershipCheck<T extends { userId: string }>({
  userId,
  resourceId,
  finder,
  resourceName,
  handler,
}: WithOwnershipCheckOptions<T>): Promise<Response> {
  const resource = await finder(resourceId);
  if (!resource || resource.userId !== userId) return notFound(resourceName);
  return handler(resource);
}
