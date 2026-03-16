import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdherenceStats } from '@/presentation/hooks/useAdherenceStats';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockStats = {
  overall: { weeklyRate: 85, monthlyRate: 90, weeklyCount: 12, monthlyCount: 50 },
  members: [
    { memberId: 'member-1', memberName: '太郎', weeklyRate: 90, monthlyRate: 95 },
  ],
};

const mockRepository = {
  getRecords: vi.fn(),
  createRecord: vi.fn(),
  deleteRecord: vi.fn(),
  getAdherenceStats: vi.fn().mockResolvedValue(mockStats),
  getHistory: vi.fn(),
  getAdherenceTrends: vi.fn(),
};

describe('useAdherenceStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      medicationRecordRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('アドヒアランス統計を取得する', async () => {
    const { result } = renderHook(() => useAdherenceStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.stats).toBeTruthy();
    expect(result.current.error).toBeNull();
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAdherenceStats.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useAdherenceStats());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
