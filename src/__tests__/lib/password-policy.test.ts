import { describe, it, expect } from 'vitest';
import { signUpSchema } from '../../lib/schemas';

describe('パスワードポリシー', () => {
  const validBase = {
    email: 'test@example.com',
    displayName: 'テスト太郎',
  };

  describe('有効なパスワード', () => {
    it.each([
      'Password1!',
      'MyP@ssw0rd',
      'Test#1234',
      'hello_World9',
      'abcDEF123$',
      'p@ssW0rd!!',
    ])('パスワード "%s" は有効', (password) => {
      const result = signUpSchema.safeParse({ ...validBase, password });
      expect(result.success).toBe(true);
    });
  });

  describe('無効なパスワード', () => {
    it('英字のみ（数字と特殊文字なし）は無効', () => {
      const result = signUpSchema.safeParse({ ...validBase, password: 'abcdefgh' });
      expect(result.success).toBe(false);
    });

    it('数字のみ（英字と特殊文字なし）は無効', () => {
      const result = signUpSchema.safeParse({ ...validBase, password: '12345678' });
      expect(result.success).toBe(false);
    });

    it('英字と数字のみ（特殊文字なし）は無効', () => {
      const result = signUpSchema.safeParse({ ...validBase, password: 'Password1' });
      expect(result.success).toBe(false);
    });

    it('7文字以下は無効', () => {
      const result = signUpSchema.safeParse({ ...validBase, password: 'Pa1!abc' });
      expect(result.success).toBe(false);
    });

    it('129文字以上は無効', () => {
      const result = signUpSchema.safeParse({
        ...validBase,
        password: 'A1!' + 'a'.repeat(126),
      });
      expect(result.success).toBe(false);
    });

    it('特殊文字なしのエラーメッセージが正しい', () => {
      const result = signUpSchema.safeParse({ ...validBase, password: 'Password1' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages).toContain('パスワードには記号を含めてください');
      }
    });
  });
});
