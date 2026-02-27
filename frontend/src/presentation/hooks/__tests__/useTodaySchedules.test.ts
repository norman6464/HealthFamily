import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTodaySchedules } from '../useTodaySchedules';

vi.mock('../../../data/api/scheduleApi', () => ({
  scheduleApi: {
    getTodaySchedules: vi.fn().mockResolvedValue([
      {
        schedule: {
          id: '1',
          medicationId: 'med-1',
          userId: 'user-1',
          memberId: 'member-1',
          scheduledTime: '08:00',
          daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
          isEnabled: true,
          reminderMinutesBefore: 10,
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
        medicationName: '血圧の薬',
        memberName: 'パパ',
        memberType: 'human',
        isCompleted: false,
      },
    ]),
    markAsCompleted: vi.fn().mockResolvedValue(undefined),
    createSchedule: vi.fn(),
    updateSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
  },
}));

describe('useTodaySchedules Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('スケジュールを正常に取得できる', async () => {
    const { result } = renderHook(() => useTodaySchedules('user-1'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.schedules).toEqual([]);
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('エラーが発生した場合、エラー状態を保持する', async () => {
    const { scheduleApi } = await import('../../../data/api/scheduleApi');
    vi.mocked(scheduleApi.getTodaySchedules).mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.schedules).toEqual([]);
  });

  it('refetchでスケジュールを再取得できる', async () => {
    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialSchedules = result.current.schedules;

    await result.current.refetch();

    expect(result.current.schedules).toEqual(initialSchedules);
  });

  it('空のスケジュール一覧が返される場合も正常に処理される', async () => {
    const { scheduleApi } = await import('../../../data/api/scheduleApi');
    vi.mocked(scheduleApi.getTodaySchedules).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
