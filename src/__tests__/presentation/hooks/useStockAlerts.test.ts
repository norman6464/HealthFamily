import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useStockAlerts } from '@/presentation/hooks/useStockAlerts';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockAlerts = [
  { medicationId: 'med-1', medicationName: 'テスト薬', currentStock: 3, threshold: 5, memberName: '太郎' },
];

const mockRepository = {
  getStockAlerts: vi.fn().mockResolvedValue(mockAlerts),
  getMedications: vi.fn(),
  getMedicationById: vi.fn(),
  createMedication: vi.fn(),
  updateMedication: vi.fn(),
  deleteMedication: vi.fn(),
  searchMedications: vi.fn(),
  updateStock: vi.fn(),
  getMedicationsByMemberId: vi.fn(),
};

describe('useStockAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      medicationRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('在庫アラートを取得する', async () => {
    const { result } = renderHook(() => useStockAlerts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.alerts).toEqual(mockAlerts);
    expect(result.current.error).toBeNull();
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getStockAlerts.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useStockAlerts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.alerts).toEqual([]);
  });

  it('refetchでデータを再取得する', async () => {
    const { result } = renderHook(() => useStockAlerts());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockRepository.getStockAlerts.mockResolvedValueOnce([]);
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.alerts).toEqual([]);
    });

    expect(mockRepository.getStockAlerts).toHaveBeenCalledTimes(2);
  });
});
