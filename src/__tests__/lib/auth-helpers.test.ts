import { describe, it, expect, vi } from 'vitest';
import { success, created, errorResponse, notFound, unauthorized, getAuthUserId } from '@/lib/auth-helpers';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

import { auth } from '@/lib/auth';

const mockAuth = vi.mocked(auth);

describe('auth-helpers', () => {
  describe('success', () => {
    it('200ステータスでJSONレスポンスを返す', async () => {
      const response = success({ message: 'ok' });
      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json).toEqual({ success: true, data: { message: 'ok' } });
    });

    it('カスタムステータスコードを指定できる', async () => {
      const response = success({ data: 'test' }, 202);
      expect(response.status).toBe(202);
    });
  });

  describe('created', () => {
    it('201ステータスでJSONレスポンスを返す', async () => {
      const response = created({ id: '1' });
      const json = await response.json();
      expect(response.status).toBe(201);
      expect(json).toEqual({ success: true, data: { id: '1' } });
    });
  });

  describe('errorResponse', () => {
    it('400ステータスでエラーレスポンスを返す', async () => {
      const response = errorResponse('入力エラー');
      const json = await response.json();
      expect(response.status).toBe(400);
      expect(json).toEqual({ success: false, error: '入力エラー' });
    });

    it('カスタムステータスコードを指定できる', async () => {
      const response = errorResponse('レート制限', 429);
      expect(response.status).toBe(429);
    });
  });

  describe('notFound', () => {
    it('404ステータスでリソース名入りエラーを返す', async () => {
      const response = notFound('メンバー');
      const json = await response.json();
      expect(response.status).toBe(404);
      expect(json).toEqual({ success: false, error: 'メンバーが見つかりません' });
    });
  });

  describe('unauthorized', () => {
    it('401ステータスで認証エラーを返す', async () => {
      const response = unauthorized();
      const json = await response.json();
      expect(response.status).toBe(401);
      expect(json).toEqual({ success: false, error: '認証エラー' });
    });
  });

  describe('getAuthUserId', () => {
    it('セッションからuserIdを取得する', async () => {
      mockAuth.mockResolvedValue({ user: { id: 'user-1', email: 'test@example.com' }, expires: '' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      const userId = await getAuthUserId();
      expect(userId).toBe('user-1');
    });

    it('セッションがない場合nullを返す', async () => {
      mockAuth.mockResolvedValue(null as ReturnType<typeof auth> extends Promise<infer T> ? T : never);
      const userId = await getAuthUserId();
      expect(userId).toBeNull();
    });
  });
});
