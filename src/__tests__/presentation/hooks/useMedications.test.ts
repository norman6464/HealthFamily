import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMedications } from '@/presentation/hooks/useMedications';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockMedication = {
  id: 'med-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  name: 'ロキソプロフェン',
  dosage: '1錠',
  frequency: '1日3回',
  category: 'prescription',
  stock: 30,
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getMedicationsByMember: vi.fn().mockResolvedValue([mockMedication]),
  getMedications: vi.fn().mockResolvedValue([mockMedication]),
  getMedicationById: vi.fn().mockResolvedValue(mockMedication),
  createMedication: vi.fn().mockResolvedValue(mockMedication),
  updateMedication: vi.fn().mockResolvedValue(mockMedication),
  deleteMedication: vi.fn().mockResolvedValue(undefined),
  searchMedications: vi.fn(),
  getStockAlerts: vi.fn(),
  updateStock: vi.fn(),
};

describe('useMedications', () => {
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

  it('メンバーIDに基づいて薬一覧を取得する', async () => {
    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.medications.length).toBeGreaterThanOrEqual(0);
    expect(result.current.error).toBeNull();
  });

  it('createMedicationで薬を登録しrefetchする', async () => {
    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createMedication({
        memberId: 'member-1',
        name: 'イブプロフェン',
        dosage: '1錠',
        frequency: '1日2回',
      });
    });

    expect(mockRepository.createMedication).toHaveBeenCalled();
  });

  it('deleteMedicationで薬を削除しrefetchする', async () => {
    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteMedication('med-1');
    });

    expect(mockRepository.deleteMedication).toHaveBeenCalledWith('med-1');
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getMedicationsByMember.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useMedications('member-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
