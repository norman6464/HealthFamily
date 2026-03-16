import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePrescriptions } from '@/presentation/hooks/usePrescriptions';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockPrescription = {
  id: 'presc-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  prescriptionName: '高血圧治療薬',
  prescribedBy: '山田医師',
  prescribedAt: '2025-12-01',
  expiresAt: null,
  pharmacyName: null,
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAll: vi.fn().mockResolvedValue([mockPrescription]),
  getById: vi.fn(),
  create: vi.fn().mockResolvedValue(mockPrescription),
  update: vi.fn().mockResolvedValue(mockPrescription),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('usePrescriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      prescriptionRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('処方箋一覧を取得する', async () => {
    const { result } = renderHook(() => usePrescriptions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.prescriptions).toEqual([mockPrescription]);
    expect(result.current.error).toBeNull();
  });

  it('createPrescriptionで処方箋を登録しrefetchする', async () => {
    const { result } = renderHook(() => usePrescriptions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createPrescription({
        memberId: 'member-1',
        prescriptionName: '抗生物質',
        prescribedAt: '2025-12-15',
      });
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('deletePrescriptionで処方箋を削除しrefetchする', async () => {
    const { result } = renderHook(() => usePrescriptions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deletePrescription('presc-1');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('presc-1');
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => usePrescriptions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.prescriptions).toEqual([]);
  });
});
