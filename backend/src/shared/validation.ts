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
