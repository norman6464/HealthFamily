import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../apiClient';
import { useAuthStore } from '../../../stores/authStore';

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn().mockReturnValue({
      getIdToken: vi.fn().mockResolvedValue('test-token'),
      signOut: vi.fn(),
    }),
  },
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      getIdToken: vi.fn().mockResolvedValue('test-token'),
      signOut: vi.fn(),
    });
  });

  it('GETリクエストを送信できる', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ success: true, data: [{ id: '1' }] }),
    });

    const result = await apiClient.get('/members');

    expect(mockFetch).toHaveBeenCalledWith('/api/members', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
    expect(result).toEqual([{ id: '1' }]);
  });

  it('POSTリクエストを送信できる', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ success: true, data: { id: 'new-1' } }),
    });

    const body = { name: 'テスト' };
    const result = await apiClient.post('/members', body);

    expect(mockFetch).toHaveBeenCalledWith('/api/members', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
    expect(result).toEqual({ id: 'new-1' });
  });

  it('PUTリクエストを送信できる', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ success: true, data: { id: '1', name: '更新' } }),
    });

    const result = await apiClient.put('/members/1', { name: '更新' });

    expect(mockFetch).toHaveBeenCalledWith('/api/members/1', {
      method: 'PUT',
      body: JSON.stringify({ name: '更新' }),
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
    expect(result).toEqual({ id: '1', name: '更新' });
  });

  it('DELETEリクエストを送信できる', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ success: true, data: null }),
    });

    await apiClient.del('/members/1');

    expect(mockFetch).toHaveBeenCalledWith('/api/members/1', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });

  it('401レスポンスでサインアウトしてエラーをスローする', async () => {
    const signOut = vi.fn();
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      getIdToken: vi.fn().mockResolvedValue('test-token'),
      signOut,
    });

    mockFetch.mockResolvedValueOnce({
      status: 401,
      json: () => Promise.resolve({ success: false, error: 'Unauthorized' }),
    });

    await expect(apiClient.get('/members')).rejects.toThrow('認証エラー');
    expect(signOut).toHaveBeenCalled();
  });

  it('APIエラーレスポンスでエラーをスローする', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 400,
      json: () => Promise.resolve({ success: false, error: 'バリデーションエラー' }),
    });

    await expect(apiClient.get('/members')).rejects.toThrow('バリデーションエラー');
  });

  it('エラーメッセージが空の場合デフォルトメッセージを使用する', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: () => Promise.resolve({ success: false }),
    });

    await expect(apiClient.get('/members')).rejects.toThrow('APIエラー');
  });

  it('トークンがない場合Authorizationヘッダーを送信しない', async () => {
    (useAuthStore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      getIdToken: vi.fn().mockResolvedValue(null),
      signOut: vi.fn(),
    });

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    await apiClient.get('/members');

    expect(mockFetch).toHaveBeenCalledWith('/api/members', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('POSTでbodyがundefinedの場合bodyを含めない', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ success: true, data: null }),
    });

    await apiClient.post('/test');

    expect(mockFetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
  });
});
