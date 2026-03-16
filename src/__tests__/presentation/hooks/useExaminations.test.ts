import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useExaminations } from '@/presentation/hooks/useExaminations';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockExamination = {
  id: 'exam-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  examinationType: '血液検査',
  examinedAt: new Date('2025-11-01'),
  nextScheduledDate: null,
  notes: '',
  createdAt: new Date(),
};

const mockRepository = {
  getAll: vi.fn().mockResolvedValue([mockExamination]),
  getById: vi.fn(),
  create: vi.fn().mockResolvedValue(mockExamination),
  update: vi.fn().mockResolvedValue(mockExamination),
  delete: vi.fn().mockResolvedValue(undefined),
};

describe('useExaminations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      examinationRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('検査一覧を取得する', async () => {
    const { result } = renderHook(() => useExaminations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.examinations).toEqual([mockExamination]);
    expect(result.current.error).toBeNull();
  });

  it('createExaminationで検査を登録しrefetchする', async () => {
    const { result } = renderHook(() => useExaminations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createExamination({
        memberId: 'member-1',
        examinationType: 'CT検査',
        examinedAt: '2025-12-01',
      });
    });

    expect(mockRepository.create).toHaveBeenCalled();
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('deleteExaminationで検査を削除しrefetchする', async () => {
    const { result } = renderHook(() => useExaminations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteExamination('exam-1');
    });

    expect(mockRepository.delete).toHaveBeenCalledWith('exam-1');
    expect(mockRepository.getAll).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useExaminations());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.examinations).toEqual([]);
  });
});
