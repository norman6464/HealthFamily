import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {},
}));

import { auth } from '@/lib/auth';
import { withAuth, withOwnershipCheck, verifyResourceOwnership } from '@/lib/api-helpers';

const mockAuth = vi.mocked(auth);

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証済みの場合ハンドラーを実行する', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: '',
    });

    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    const wrappedHandler = withAuth(handler);
    const response = await wrappedHandler();

    expect(handler).toHaveBeenCalledWith('user-1');
    expect(response.status).toBe(200);
  });

  it('未認証の場合401を返す', async () => {
    mockAuth.mockResolvedValue(null);

    const handler = vi.fn();
    const wrappedHandler = withAuth(handler);
    const response = await wrappedHandler();

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });

  it('ハンドラーでエラー時500を返す', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      expires: '',
    });

    const handler = vi.fn().mockRejectedValue(new Error('DB error'));
    const wrappedHandler = withAuth(handler);
    const response = await wrappedHandler();

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

describe('withOwnershipCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('所有権が確認できた場合ハンドラーを実行する', async () => {
    const finder = vi.fn().mockResolvedValue({ id: 'res-1', userId: 'user-1' });
    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    const result = await withOwnershipCheck({
      userId: 'user-1',
      resourceId: 'res-1',
      finder,
      resourceName: 'リソース',
      handler,
    });

    expect(finder).toHaveBeenCalledWith('res-1');
    expect(handler).toHaveBeenCalledWith({ id: 'res-1', userId: 'user-1' });
    expect(result.status).toBe(200);
  });

  it('リソースが見つからない場合404を返す', async () => {
    const finder = vi.fn().mockResolvedValue(null);
    const handler = vi.fn();

    const result = await withOwnershipCheck({
      userId: 'user-1',
      resourceId: 'res-1',
      finder,
      resourceName: 'リソース',
      handler,
    });

    expect(handler).not.toHaveBeenCalled();
    expect(result.status).toBe(404);
  });

  it('所有権が一致しない場合404を返す', async () => {
    const finder = vi.fn().mockResolvedValue({ id: 'res-1', userId: 'other-user' });
    const handler = vi.fn();

    const result = await withOwnershipCheck({
      userId: 'user-1',
      resourceId: 'res-1',
      finder,
      resourceName: 'リソース',
      handler,
    });

    expect(handler).not.toHaveBeenCalled();
    expect(result.status).toBe(404);
  });
});

describe('verifyResourceOwnership', () => {
  it('全てのリソースが所有者に属している場合nullを返す', async () => {
    const result = await verifyResourceOwnership('user-1', [
      { finder: vi.fn().mockResolvedValue({ userId: 'user-1' }), resourceName: 'メンバー' },
      { finder: vi.fn().mockResolvedValue({ userId: 'user-1' }), resourceName: '薬' },
    ]);
    expect(result).toBeNull();
  });

  it('リソースが見つからない場合404レスポンスを返す', async () => {
    const result = await verifyResourceOwnership('user-1', [
      { finder: vi.fn().mockResolvedValue(null), resourceName: 'メンバー' },
    ]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
    const body = await result!.json();
    expect(body.error).toContain('メンバー');
  });

  it('リソースの所有者が異なる場合404レスポンスを返す', async () => {
    const result = await verifyResourceOwnership('user-1', [
      { finder: vi.fn().mockResolvedValue({ userId: 'user-1' }), resourceName: 'メンバー' },
      { finder: vi.fn().mockResolvedValue({ userId: 'user-2' }), resourceName: '薬' },
    ]);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(404);
    const body = await result!.json();
    expect(body.error).toContain('薬');
  });
});
