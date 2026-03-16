import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdherenceTrends } from '@/presentation/hooks/useAdherenceTrends';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockTrend = {
  dailyRates: [80, 85, 90, 95, 100],
  weeklyAverage: 90,
  direction: 'up' as const,
};

const mockRepository = {
  getRecords: vi.fn(),
  createRecord: vi.fn(),
  deleteRecord: vi.fn(),
  getAdherenceStats: vi.fn(),
  getHistory: vi.fn(),
  getAdherenceTrends: vi.fn().mockResolvedValue(mockTrend),
};

describe('useAdherenceTrends', () => {
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

  it('アドヒアランストレンドを取得する', async () => {
    const { result } = renderHook(() => useAdherenceTrends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.trend).toBeTruthy();
    expect(result.current.error).toBeNull();
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAdherenceTrends.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useAdherenceTrends());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.trend).toBeNull();
  });
});
