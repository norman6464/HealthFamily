import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSchedules } from '@/presentation/hooks/useSchedules';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';
import { clearFetcherCache } from '@/presentation/hooks/useFetcher';

const mockScheduleWithDetails = {
  schedule: {
    id: 'sch-1',
    medicationId: 'med-1',
    userId: 'user-1',
    memberId: 'member-1',
    scheduledTime: '08:00',
    daysOfWeek: [],
    isEnabled: true,
    reminderMinutesBefore: 10,
    createdAt: new Date(),
  },
  medicationName: 'テスト薬',
  memberName: '太郎',
};

const mockRepository = {
  getSchedules: vi.fn().mockResolvedValue([mockScheduleWithDetails]),
  getSchedulesRaw: vi.fn().mockResolvedValue([]),
  getScheduleById: vi.fn(),
  getTodaySchedules: vi.fn().mockResolvedValue([]),
  findOverlapping: vi.fn().mockResolvedValue(null),
  createSchedule: vi.fn().mockResolvedValue(mockScheduleWithDetails.schedule),
  updateSchedule: vi.fn().mockResolvedValue(mockScheduleWithDetails.schedule),
  deleteSchedule: vi.fn().mockResolvedValue(undefined),
  markAsCompleted: vi.fn().mockResolvedValue(undefined),
};

describe('useSchedules', () => {
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

  it('スケジュール一覧を取得する', async () => {
    const { result } = renderHook(() => useSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([mockScheduleWithDetails]);
    expect(result.current.error).toBeNull();
    expect(result.current.isCreating).toBe(false);
  });

  it('createScheduleでスケジュールを作成しrefetchする', async () => {
    const { result } = renderHook(() => useSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createSchedule({
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'member-1',
        scheduledTime: '09:00',
        daysOfWeek: [],
        reminderMinutesBefore: 5,
      });
    });

    expect(mockRepository.createSchedule).toHaveBeenCalled();
    expect(mockRepository.getSchedules).toHaveBeenCalledTimes(2);
  });

  it('deleteScheduleでスケジュールを削除しrefetchする', async () => {
    const { result } = renderHook(() => useSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteSchedule('sch-1');
    });

    expect(mockRepository.deleteSchedule).toHaveBeenCalledWith('sch-1');
    expect(mockRepository.getSchedules).toHaveBeenCalledTimes(2);
  });

  it('取得エラー時にerrorを設定する', async () => {
    mockRepository.getSchedules.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useSchedules());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(new Error('取得失敗'));
    expect(result.current.schedules).toEqual([]);
  });
});
