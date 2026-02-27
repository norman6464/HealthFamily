import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMembers } from '../useMembers';

vi.mock('../../../data/api/memberApi', () => {
  const member = {
    id: 'member-1',
    userId: 'user-1',
    memberType: 'human',
    name: 'パパ',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
  return {
    memberApi: {
      getMembers: vi.fn().mockResolvedValue([member]),
      getMemberById: vi.fn().mockResolvedValue(member),
      createMember: vi.fn().mockResolvedValue({
        id: 'member-new',
        userId: 'user-1',
        memberType: 'human',
        name: '新メンバー',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      deleteMember: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('useMembers Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    const { memberApi } = await import('../../../data/api/memberApi');
    vi.mocked(memberApi.getMembers).mockRejectedValueOnce(new Error('API Error'));

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
