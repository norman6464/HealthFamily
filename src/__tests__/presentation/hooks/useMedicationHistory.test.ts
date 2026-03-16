import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMedicationHistory } from '@/presentation/hooks/useMedicationHistory';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockRecord = {
  id: 'rec-1',
  medicationId: 'med-1',
  medicationName: 'テスト薬',
  memberName: '太郎',
  takenAt: new Date('2025-12-01T08:00:00'),
  notes: '',
};

const mockRepository = {
  getRecords: vi.fn(),
  createRecord: vi.fn().mockResolvedValue(undefined),
  deleteRecord: vi.fn().mockResolvedValue(undefined),
  getAdherenceStats: vi.fn(),
  getHistory: vi.fn().mockResolvedValue([mockRecord]),
  getAdherenceTrends: vi.fn(),
};

describe('useMedicationHistory', () => {
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

  it('服薬履歴を取得する', async () => {
    const { result } = renderHook(() => useMedicationHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });

  it('deleteRecordで履歴を削除しrefetchする', async () => {
    const { result } = renderHook(() => useMedicationHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteRecord('rec-1');
    });

    expect(mockRepository.deleteRecord).toHaveBeenCalledWith('rec-1');
    expect(mockRepository.getHistory).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getHistory.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useMedicationHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
