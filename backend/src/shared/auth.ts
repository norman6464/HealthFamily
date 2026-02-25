import type { Request, Response, NextFunction } from 'express';

/**
 * 認証ミドルウェア
 * x-user-idヘッダーの存在を検証する
 * 本番環境ではAPI Gateway + Cognitoで認証済みだが、
 * Express層でもユーザーIDの存在を保証する
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string | undefined;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
    });
  }

  next();
}

/**
 * リクエストからユーザーIDを安全に取得する
 * requireAuthミドルウェア通過後に使用すること
 */
export function getUserId(req: Request): string {
  return req.headers['x-user-id'] as string;
}
