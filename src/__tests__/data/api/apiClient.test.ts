import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/data/api/apiClient';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockResponse = (data: unknown, success = true, status = 200) => {
  return Promise.resolve({
    status,
    json: () => Promise.resolve({ success, data, error: success ? undefined : String(data) }),
  });
};

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GETリクエストを送信する', async () => {
    mockFetch.mockReturnValue(mockResponse({ id: '1' }));
    const result = await apiClient.get('/members');
    expect(mockFetch).toHaveBeenCalledWith('/api/members', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toEqual({ id: '1' });
  });

  it('POSTリクエストをボディ付きで送信する', async () => {
    mockFetch.mockReturnValue(mockResponse({ id: '2' }));
    const body = { name: 'テスト' };
    await apiClient.post('/members', body);
    expect(mockFetch).toHaveBeenCalledWith('/api/members', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('PUTリクエストを送信する', async () => {
    mockFetch.mockReturnValue(mockResponse({ id: '1' }));
    const body = { name: '更新' };
    await apiClient.put('/members/1', body);
    expect(mockFetch).toHaveBeenCalledWith('/api/members/1', {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('DELETEリクエストを送信する', async () => {
    mockFetch.mockReturnValue(mockResponse(null));
    await apiClient.del('/members/1');
    expect(mockFetch).toHaveBeenCalledWith('/api/members/1', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
  });

  it('APIエラー時にエラーをスローする', async () => {
    mockFetch.mockReturnValue(mockResponse('バリデーションエラー', false));
    await expect(apiClient.get('/members')).rejects.toThrow('バリデーションエラー');
  });

  it('401レスポンス時にログインページへリダイレクトする', async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    mockFetch.mockReturnValue(
      Promise.resolve({ status: 401, json: () => Promise.resolve({}) }),
    );
    await expect(apiClient.get('/members')).rejects.toThrow('認証エラー');
    expect(window.location.href).toBe('/login');
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });
});
