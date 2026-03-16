import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useHospitals } from '@/presentation/hooks/useHospitals';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockHospital = {
  id: 'hosp-1',
  userId: 'user-1',
  name: 'テスト病院',
  department: '内科',
  doctorName: '山田医師',
  phoneNumber: '03-1234-5678',
  address: '東京都渋谷区',
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getHospitals: vi.fn().mockResolvedValue([mockHospital]),
  getHospitalById: vi.fn(),
  createHospital: vi.fn().mockResolvedValue(mockHospital),
  updateHospital: vi.fn().mockResolvedValue(mockHospital),
  deleteHospital: vi.fn().mockResolvedValue(undefined),
};

describe('useHospitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      hospitalRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('病院一覧を取得する', async () => {
    const { result } = renderHook(() => useHospitals());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hospitals).toEqual([mockHospital]);
    expect(result.current.error).toBeNull();
  });

  it('createHospitalで病院を作成しrefetchする', async () => {
    const { result } = renderHook(() => useHospitals());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createHospital({
        userId: 'user-1',
        name: '新病院',
      });
    });

    expect(mockRepository.createHospital).toHaveBeenCalled();
    expect(mockRepository.getHospitals).toHaveBeenCalledTimes(2);
  });

  it('deleteHospitalで病院を削除しrefetchする', async () => {
    const { result } = renderHook(() => useHospitals());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteHospital('hosp-1');
    });

    expect(mockRepository.deleteHospital).toHaveBeenCalledWith('hosp-1');
    expect(mockRepository.getHospitals).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getHospitals.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useHospitals());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.hospitals).toEqual([]);
  });
});
