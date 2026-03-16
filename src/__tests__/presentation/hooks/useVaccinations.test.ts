import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useVaccinations } from '@/presentation/hooks/useVaccinations';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockVaccination = {
  id: 'vac-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  vaccineName: 'インフルエンザ',
  vaccinatedAt: new Date('2025-10-01'),
  nextScheduledDate: new Date('2026-10-01'),
  hospitalName: 'テスト病院',
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAll: vi.fn().mockResolvedValue([mockVaccination]),
  getById: vi.fn(),
  create: vi.fn().mockResolvedValue(mockVaccination),
  update: vi.fn().mockResolvedValue(mockVaccination),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('useVaccinations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      vaccinationRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('ワクチン一覧を取得する', async () => {
    const { result } = renderHook(() => useVaccinations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.vaccinations).toEqual([mockVaccination]);
    expect(result.current.error).toBeNull();
  });

  it('createVaccinationでワクチンを登録しrefetchする', async () => {
    const { result } = renderHook(() => useVaccinations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createVaccination({
        userId: 'user-1',
        memberId: 'member-1',
        vaccineName: 'コロナワクチン',
        vaccinatedAt: new Date(),
      });
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('deleteVaccinationでワクチンを削除しrefetchする', async () => {
    const { result } = renderHook(() => useVaccinations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteVaccination('vac-1');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('vac-1');
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useVaccinations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.vaccinations).toEqual([]);
  });
});
