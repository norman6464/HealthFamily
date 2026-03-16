import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMembers } from '@/presentation/hooks/useMembers';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';
import { Member } from '@/domain/entities/Member';

const mockMember: Member = {
  id: 'member-1',
  userId: 'user-1',
  memberType: 'human',
  name: '太郎',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepository = {
  getMembers: vi.fn().mockResolvedValue([mockMember]),
  getMemberById: vi.fn().mockResolvedValue(mockMember),
  createMember: vi.fn().mockResolvedValue(mockMember),
  updateMember: vi.fn().mockResolvedValue(mockMember),
  deleteMember: vi.fn().mockResolvedValue(undefined),
  getMemberSummaries: vi.fn(),
};

describe('useMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      memberRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('メンバー一覧を取得する', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.members).toEqual([mockMember]);
    expect(result.current.error).toBeNull();
    expect(mockRepository.getMembers).toHaveBeenCalledWith('user-1');
  });

  it('userIdが空の場合は空配列を返す', async () => {
    const { result } = renderHook(() => useMembers(''));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.members).toEqual([]);
    expect(mockRepository.getMembers).not.toHaveBeenCalled();
  });

  it('createMemberでメンバーを作成しrefetchする', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createMember({
        userId: 'user-1',
        memberType: 'human',
        name: '花子',
      });
    });

    expect(mockRepository.createMember).toHaveBeenCalledWith({
      userId: 'user-1',
      memberType: 'human',
      name: '花子',
    });
    expect(mockRepository.getMembers).toHaveBeenCalledTimes(2);
  });

  it('updateMemberでメンバーを更新しrefetchする', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updateMember('member-1', { name: '太郎(更新)' });
    });

    expect(mockRepository.updateMember).toHaveBeenCalledWith('member-1', { name: '太郎(更新)' });
    expect(mockRepository.getMembers).toHaveBeenCalledTimes(2);
  });

  it('deleteMemberでメンバーを削除しrefetchする', async () => {
    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteMember('member-1');
    });

    expect(mockRepository.deleteMember).toHaveBeenCalledWith('member-1');
    expect(mockRepository.getMembers).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getMembers.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useMembers('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.members).toEqual([]);
  });
});
