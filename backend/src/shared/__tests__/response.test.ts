import { describe, it, expect, vi } from 'vitest';
import { success, created, error, notFound } from '../response';
import type { Response } from 'express';

const createMockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('response', () => {
  describe('success', () => {
    it('200ステータスとデータを返す', () => {
      const res = createMockRes();
      success(res, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
      });
    });

    it('カスタムステータスコードを指定できる', () => {
      const res = createMockRes();
      success(res, { id: 1 }, 202);

      expect(res.status).toHaveBeenCalledWith(202);
    });
  });

  describe('created', () => {
    it('201ステータスを返す', () => {
      const res = createMockRes();
      created(res, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
      });
    });
  });

  describe('error', () => {
    it('エラーメッセージを返す', () => {
      const res = createMockRes();
      error(res, 'エラー', 500);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'エラー',
      });
    });

    it('デフォルトで400ステータスを返す', () => {
      const res = createMockRes();
      error(res, 'バリデーションエラー');

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('notFound', () => {
    it('404ステータスとリソース名を返す', () => {
      const res = createMockRes();
      notFound(res, 'メンバー');

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'メンバーが見つかりません',
      });
    });

    it('デフォルトのリソース名を使用する', () => {
      const res = createMockRes();
      notFound(res);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'リソースが見つかりません',
      });
    });
  });
});
