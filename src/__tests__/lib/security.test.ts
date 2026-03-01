import { describe, it, expect, beforeEach } from 'vitest';
import { timingSafeEqual, escapeHtml, checkRateLimit } from '@/lib/security';

describe('timingSafeEqual', () => {
  it('同じ文字列で true を返す', () => {
    expect(timingSafeEqual('123456', '123456')).toBe(true);
  });

  it('異なる文字列で false を返す', () => {
    expect(timingSafeEqual('123456', '654321')).toBe(false);
  });

  it('長さの異なる文字列で false を返す', () => {
    expect(timingSafeEqual('123', '123456')).toBe(false);
  });

  it('空文字列同士で true を返す', () => {
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

describe('escapeHtml', () => {
  it('HTMLの特殊文字をエスケープする', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('アンパサンドをエスケープする', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('シングルクォートをエスケープする', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('通常の文字列はそのまま返す', () => {
    expect(escapeHtml('テスト太郎')).toBe('テスト太郎');
  });

  it('空文字列はそのまま返す', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    // テスト間で状態をリセットするため、ユニークなキーを使用
  });

  it('制限内のリクエストを許可する', () => {
    const key = `test-allow-${Date.now()}`;
    const result = checkRateLimit(key, { maxAttempts: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('制限を超えたリクエストを拒否する', () => {
    const key = `test-deny-${Date.now()}`;
    const config = { maxAttempts: 3, windowMs: 60000 };

    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    const result = checkRateLimit(key, config);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('残り回数を正しく返す', () => {
    const key = `test-remaining-${Date.now()}`;
    const config = { maxAttempts: 3, windowMs: 60000 };

    expect(checkRateLimit(key, config).remaining).toBe(2);
    expect(checkRateLimit(key, config).remaining).toBe(1);
    expect(checkRateLimit(key, config).remaining).toBe(0);
  });
});
