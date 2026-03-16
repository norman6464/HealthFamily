import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMedicationSearch } from '@/presentation/hooks/useMedicationSearch';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';

const mockResults = [
  { name: 'ロキソプロフェン', genericName: 'ロキソプロフェンナトリウム' },
  { name: 'イブプロフェン', genericName: 'イブプロフェン' },
];

const mockRepository = {
  searchMedications: vi.fn().mockResolvedValue(mockResults),
  getMedications: vi.fn(),
  getMedicationById: vi.fn(),
  createMedication: vi.fn(),
  updateMedication: vi.fn(),
  deleteMedication: vi.fn(),
  getStockAlerts: vi.fn(),
  updateStock: vi.fn(),
  getMedicationsByMemberId: vi.fn(),
};

describe('useMedicationSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDIContainer({
      medicationRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('初期状態で検索結果が空である', () => {
    const { result } = renderHook(() => useMedicationSearch());

    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('検索を実行して結果を返す', async () => {
    const { result } = renderHook(() => useMedicationSearch());

    await act(async () => {
      await result.current.search('ロキソ');
    });

    expect(result.current.results).toEqual(mockResults);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.isSearching).toBe(false);
  });

  it('検索エラー時にerrorを設定する', async () => {
    mockRepository.searchMedications.mockRejectedValueOnce(new Error('API Error'));
    const { result } = renderHook(() => useMedicationSearch());

    await act(async () => {
      await result.current.search('テスト');
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.results).toEqual([]);
    expect(result.current.hasSearched).toBe(true);
  });

  it('Error以外の例外もエラーとして処理する', async () => {
    mockRepository.searchMedications.mockRejectedValueOnce('文字列エラー');
    const { result } = renderHook(() => useMedicationSearch());

    await act(async () => {
      await result.current.search('テスト');
    });

    expect(result.current.error?.message).toBe('検索に失敗しました');
  });
});
