import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useBodyMeasurements } from '@/presentation/hooks/useBodyMeasurements';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockMeasurement = {
  id: 'bm-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  weight: 65.5,
  height: 170.0,
  recordedAt: new Date('2025-12-01'),
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAll: vi.fn().mockResolvedValue([mockMeasurement]),
  getById: vi.fn(),
  create: vi.fn().mockResolvedValue(mockMeasurement),
  update: vi.fn().mockResolvedValue(mockMeasurement),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('useBodyMeasurements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      bodyMeasurementRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('計測記録一覧を取得する', async () => {
    const { result } = renderHook(() => useBodyMeasurements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.measurements).toEqual([mockMeasurement]);
    expect(result.current.error).toBeNull();
  });

  it('createMeasurementで記録を登録しrefetchする', async () => {
    const { result } = renderHook(() => useBodyMeasurements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createMeasurement({
        memberId: 'member-1',
        weight: 66.0,
        recordedAt: '2025-12-15',
      });
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('deleteMeasurementで記録を削除しrefetchする', async () => {
    const { result } = renderHook(() => useBodyMeasurements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteMeasurement('bm-1');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('bm-1');
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useBodyMeasurements());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.measurements).toEqual([]);
  });
});
