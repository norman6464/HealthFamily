import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAllergies } from '@/presentation/hooks/useAllergies';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockAllergy = {
  id: 'allergy-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  allergen: 'スギ花粉',
  severity: 'moderate',
  allergyType: 'environmental',
  symptoms: '鼻水、くしゃみ',
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAll: vi.fn().mockResolvedValue([mockAllergy]),
  getById: vi.fn(),
  create: vi.fn().mockResolvedValue(mockAllergy),
  update: vi.fn().mockResolvedValue(mockAllergy),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('useAllergies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      allergyRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('アレルギー一覧を取得する', async () => {
    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.allergies).toEqual([mockAllergy]);
    expect(result.current.error).toBeNull();
  });

  it('createAllergyでアレルギーを登録しrefetchする', async () => {
    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createAllergy({
        memberId: 'member-1',
        allergenName: 'ピーナッツ',
        severity: 'severe',
        allergyType: 'food',
      });
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('deleteAllergyでアレルギーを削除しrefetchする', async () => {
    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteAllergy('allergy-1');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('allergy-1');
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useAllergies());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.allergies).toEqual([]);
  });
});
