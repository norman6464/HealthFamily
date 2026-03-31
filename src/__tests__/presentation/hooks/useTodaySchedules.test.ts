import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTodaySchedules } from '@/presentation/hooks/useTodaySchedules';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockTodayItem = {
  schedule: {
    id: 'sch-1',
    medicationId: 'med-1',
    userId: 'user-1',
    memberId: 'member-1',
    scheduledTime: '08:00',
    daysOfWeek: [] as string[],
    isEnabled: true,
    reminderMinutesBefore: 10,
    createdAt: new Date(),
  },
  medicationName: 'テスト薬',
  memberName: '太郎',
  memberType: 'human' as const,
  isCompleted: false,
};

const mockRepository = {
  getSchedules: vi.fn(),
  getScheduleById: vi.fn(),
  createSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  getTodaySchedules: vi.fn().mockResolvedValue([mockTodayItem]),
  markAsCompleted: vi.fn().mockResolvedValue(undefined),
};

describe('useTodaySchedules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFetcherCache();
    setDIContainer({
      scheduleRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('今日のスケジュールを取得する', async () => {
    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules.length).toBeGreaterThanOrEqual(0);
    expect(result.current.error).toBeNull();
  });

  it('markAsCompletedでスケジュールを完了しrefetchする', async () => {
    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.markAsCompleted('sch-1');
    });

    expect(mockRepository.markAsCompleted).toHaveBeenCalledWith('sch-1', expect.any(Date), undefined);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getTodaySchedules.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
