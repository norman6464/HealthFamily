import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * 入力バリデーションユーティリティ
 * リクエストボディから許可されたフィールドのみを抽出する
 */

/**
 * 許可されたフィールドのみを抽出する
 * プロトタイプ汚染攻撃やシステムフィールドの上書きを防止
 */
export function pickAllowedFields<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  allowedFields: string[]
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field) && body[field] !== undefined) {
      result[field] = body[field];
    }
  }
  return result as Partial<T>;
}

/**
 * 文字列フィールドのバリデーション
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 文字列の長さを制限（DoS防止）
 */
export function isValidLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Zodスキーマによるバリデーションミドルウェア
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => e.message).join(', ');
        return res.status(400).json({ success: false, error: message });
      }
      next(err);
    }
  };
}
