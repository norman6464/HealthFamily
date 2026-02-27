import type { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from './env.js';
import { logger } from './logger.js';

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: env.USER_POOL_ID,
      tokenUse: 'id',
      clientId: env.USER_POOL_CLIENT_ID,
    });
  }
  return verifier;
}

/**
 * 認証ミドルウェア
 * Authorization: Bearer <token> ヘッダーのCognito IDトークンを検証する
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '認証が必要です',
    });
  }

  const token = authHeader.slice(7);

  try {
    const payload = await getVerifier().verify(token);
    (req as Request & { auth?: { userId: string; email: string } }).auth = {
      userId: payload.sub,
      email: (payload.email as string) || '',
    };
    next();
  } catch (err) {
    logger.error('トークン検証に失敗', err);
    return res.status(401).json({
      success: false,
      error: '無効なトークンです',
    });
  }
}

/**
 * リクエストからユーザーIDを安全に取得する
 * requireAuthミドルウェア通過後に使用すること
 */
export function getUserId(req: Request): string {
  return (req as Request & { auth?: { userId: string } }).auth?.userId || '';
}

/**
 * リクエストからメールアドレスを取得する
 */
export function getUserEmail(req: Request): string {
  return (req as Request & { auth?: { email: string } }).auth?.email || '';
}
