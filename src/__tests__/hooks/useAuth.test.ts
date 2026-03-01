import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

import { useSession } from 'next-auth/react';

describe('useAuth', () => {
  it('認証済みの場合にユーザー情報を返す', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.userId).toBe('user-1');
    expect(result.current.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('未認証の場合に空の情報を返す', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.userId).toBe('');
    expect(result.current.email).toBe('');
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('ローディング中の場合にisLoadingがtrueを返す', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('セッションにユーザー情報がない場合に空文字を返す', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: {}, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.userId).toBe('');
    expect(result.current.email).toBe('');
  });
});
