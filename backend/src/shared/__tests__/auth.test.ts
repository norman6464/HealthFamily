import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// CognitoJwtVerifierのモック
const mockVerify = vi.fn();
vi.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: () => ({
      verify: mockVerify,
    }),
  },
}));

import { requireAuth, getUserId } from '../auth';

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
  beforeEach(() => {
    mockVerify.mockReset();
  });

  describe('requireAuth', () => {
    it('有効なBearerトークンがある場合、nextを呼ぶ', async () => {
      mockVerify.mockResolvedValueOnce({
        sub: 'user-123',
        email: 'test@example.com',
      });
      const req = createMockReq({ authorization: 'Bearer valid-token' });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockVerify).toHaveBeenCalledWith('valid-token');
    });

    it('Authorizationヘッダーがない場合、401を返す', async () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '認証が必要です',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('Bearer接頭辞がない場合、401を返す', async () => {
      const req = createMockReq({ authorization: 'token-only' });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('無効なトークンの場合、401を返す', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Invalid token'));
      const req = createMockReq({ authorization: 'Bearer invalid-token' });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '無効なトークンです',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getUserId', () => {
    it('認証済みリクエストからユーザーIDを返す', async () => {
      mockVerify.mockResolvedValueOnce({
        sub: 'user-456',
        email: 'test@example.com',
      });
      const req = createMockReq({ authorization: 'Bearer valid-token' });
      const res = createMockRes();
      const next = vi.fn() as NextFunction;

      await requireAuth(req, res, next);

      expect(getUserId(req)).toBe('user-456');
    });
  });
});
