import crypto from 'crypto';

/**
 * タイミングセーフな文字列比較
 * タイミング攻撃を防ぐために固定時間で比較する
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // 長さが異なる場合もタイミングを一定にするためダミー比較を行う
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * HTMLエスケープ
 * メールテンプレートなどでユーザー入力を安全に埋め込む
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * インメモリレート制限
 * IPアドレスまたはキーに基づいてリクエストを制限する
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// 古いエントリを定期的にクリーンアップ
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxAttempts - 1 };
  }

  if (entry.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxAttempts - entry.count };
}
