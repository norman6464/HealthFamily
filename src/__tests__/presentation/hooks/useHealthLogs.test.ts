import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useHealthLogs } from '@/presentation/hooks/useHealthLogs';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockLog = {
  id: 'log-1',
  memberId: 'member-1',
  memberName: '太郎',
  userId: 'user-1',
  conditionLevel: 4,
  symptoms: [],
  notes: '',
  recordedAt: new Date('2025-12-01T09:00:00'),
};

const mockRepository = {
  getLogs: vi.fn().mockResolvedValue([mockLog]),
  createLog: vi.fn().mockResolvedValue(undefined),
  deleteLog: vi.fn().mockResolvedValue(undefined),
};

describe('useHealthLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      healthLogRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('体調記録をグループ化して取得する', async () => {
    const { result } = renderHook(() => useHealthLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.groups.length).toBeGreaterThanOrEqual(1);
    expect(result.current.error).toBeNull();
  });

  it('createLogで体調記録を作成しrefetchする', async () => {
    const { result } = renderHook(() => useHealthLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createLog({
        memberId: 'member-1',
        conditionLevel: 3,
        symptoms: ['headache'],
      });
    });

    expect(mockRepository.createLog).toHaveBeenCalled();
    expect(mockRepository.getLogs).toHaveBeenCalledTimes(2);
  });

  it('deleteLogで体調記録を削除しrefetchする', async () => {
    const { result } = renderHook(() => useHealthLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteLog('log-1');
    });

    expect(mockRepository.deleteLog).toHaveBeenCalledWith('log-1');
    expect(mockRepository.getLogs).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getLogs.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useHealthLogs());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.groups).toEqual([]);
  });
});
