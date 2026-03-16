import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInsurances } from '@/presentation/hooks/useInsurances';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockInsurance = {
  id: 'ins-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  insuranceType: '国民健康保険',
  providerName: null,
  policyNumber: null,
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAll: vi.fn().mockResolvedValue([mockInsurance]),
  getById: vi.fn(),
  create: vi.fn().mockResolvedValue(mockInsurance),
  update: vi.fn().mockResolvedValue(mockInsurance),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('useInsurances', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      insuranceRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('保険一覧を取得する', async () => {
    const { result } = renderHook(() => useInsurances());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.insurances).toEqual([mockInsurance]);
    expect(result.current.error).toBeNull();
  });

  it('createInsuranceで保険を登録しrefetchする', async () => {
    const { result } = renderHook(() => useInsurances());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createInsurance({
        memberId: 'member-1',
        insuranceType: '生命保険',
      });
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('deleteInsuranceで保険を削除しrefetchする', async () => {
    const { result } = renderHook(() => useInsurances());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteInsurance('ins-1');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('ins-1');
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useInsurances());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.insurances).toEqual([]);
  });
});
