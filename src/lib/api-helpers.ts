/**
 * APIルートハンドラー用ヘルパー関数
 * 認証チェック・所有権チェックの共通パターンを抽出
 */

import { z } from 'zod';
import { getAuthUserId, unauthorized, errorResponse, notFound } from './auth-helpers';

const paramIdSchema = z.string().min(1).max(50);

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
  const idError = validateParamId(resourceId);
  if (idError) return idError;
  const resource = await finder(resourceId);
  if (!resource || resource.userId !== userId) return notFound(resourceName);
  return handler(resource);
}

/**
 * リソースの所有権を検証する
 * 指定されたリソースが指定ユーザーに属しているか確認する
 */
export async function verifyResourceOwnership(
  userId: string,
  checks: Array<{
    finder: () => Promise<{ userId: string } | null>;
    resourceName: string;
  }>,
): Promise<Response | null> {
  for (const check of checks) {
    const resource = await check.finder();
    if (!resource || resource.userId !== userId) {
      return notFound(check.resourceName);
    }
  }
  return null;
}

/**
 * 動的ルートパラメータのIDをバリデーションする
 * 不正なIDの場合はエラーレスポンスを返す
 */
export function validateParamId(id: string): Response | null {
  const result = paramIdSchema.safeParse(id);
  if (!result.success) {
    return errorResponse('無効なIDです', 400);
  }
  return null;
}

/**
 * リクエストボディのサイズを検証する
 * 制限を超える場合は413レスポンスを返す
 */
const MAX_BODY_SIZE = 100 * 1024; // 100KB

export function validateBodySize(request: Request): Response | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return errorResponse('リクエストボディが大きすぎます', 413);
  }
  return null;
}
