import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMemberSummaries } from '@/presentation/hooks/useMemberSummaries';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockSummary = {
  memberId: 'member-1',
  memberName: '太郎',
  medicationCount: 3,
  adherenceRate: 85,
};

const mockRepository = {
  getMembers: vi.fn(),
  getMemberById: vi.fn(),
  createMember: vi.fn(),
  updateMember: vi.fn(),
  deleteMember: vi.fn(),
  getMemberSummaries: vi.fn().mockResolvedValue([mockSummary]),
};

describe('useMemberSummaries', () => {
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

  it('メンバーサマリーを取得する', async () => {
    const { result } = renderHook(() => useMemberSummaries());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.summaries).toEqual([mockSummary]);
    expect(result.current.error).toBeNull();
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getMemberSummaries.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useMemberSummaries());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.summaries).toEqual([]);
  });
});
