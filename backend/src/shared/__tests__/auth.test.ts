import { describe, it, expect, vi } from 'vitest';
import { requireAuth, getUserId } from '../auth';
import type { Request, Response, NextFunction } from 'express';

const createMockReq = (headers: Record<string, string> = {}): Request => {
  return { headers } as Request;
};

const createMockRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
};

describe('auth', () => {
  describe('requireAuth', () => {
    it('x-user-idヘッダーがある場合、nextを呼ぶ', () => {
      const req = createMockReq({ 'x-user-id': 'user-123' });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('x-user-idヘッダーがない場合、401を返す', () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '認証が必要です',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('x-user-idが空文字の場合、401を返す', () => {
      const req = createMockReq({ 'x-user-id': '' });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('x-user-idが空白のみの場合、401を返す', () => {
      const req = createMockReq({ 'x-user-id': '   ' });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getUserId', () => {
    it('x-user-idヘッダーの値を返す', () => {
      const req = createMockReq({ 'x-user-id': 'user-456' });

      expect(getUserId(req)).toBe('user-456');
    });
  });
});
