import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMembers } from '../useMembers';
import * as memberApiModule from '../../../data/api/memberApi';

describe('useMembers Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('メンバー一覧を正常に取得できる', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.members).toEqual([]);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.members.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('エラーが発生した場合、エラー状態を保持する', async () => {
    vi.spyOn(memberApiModule.memberApi, 'getMembers').mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.members).toEqual([]);
  });

  it('メンバーを作成できる', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createMember({
        userId: 'user-1',
        memberType: 'human',
        name: '新メンバー',
      });
    });

    expect(result.current.members.length).toBeGreaterThanOrEqual(1);
  });

  it('メンバーを削除できる', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialLength = result.current.members.length;

    if (initialLength > 0) {
      await act(async () => {
        await result.current.deleteMember(result.current.members[0].id);
      });

      expect(result.current.members.length).toBeLessThan(initialLength);
    }
  });

  it('refetchでメンバー一覧を再取得できる', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.members.length).toBeGreaterThan(0);
  });
});
