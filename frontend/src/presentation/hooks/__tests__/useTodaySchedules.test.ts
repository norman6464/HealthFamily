import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTodaySchedules } from '../useTodaySchedules';
import * as ScheduleRepositoryModule from '../../../data/repositories/ScheduleRepositoryImpl';
import { ScheduleRepository } from '../../../domain/repositories/ScheduleRepository';
import { Schedule } from '../../../domain/entities/Schedule';

// モックリポジトリ
const createMockRepository = (): ScheduleRepository => {
  const mockSchedule: Schedule = {
    id: 'schedule-1',
    medicationId: 'med-1',
    userId: 'user-1',
    memberId: 'member-1',
    scheduledTime: '08:00',
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
    isEnabled: true,
    reminderMinutesBefore: 10,
    createdAt: new Date('2024-01-01'),
  };

  return {
    getTodaySchedules: vi.fn().mockResolvedValue([
      {
        schedule: mockSchedule,
        medicationName: '血圧の薬',
        memberName: 'テストユーザー',
        memberType: 'human' as const,
        isCompleted: false,
      },
    ]),
    createSchedule: vi.fn(),
    updateSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
    markAsCompleted: vi.fn(),
  };
};

describe('useTodaySchedules Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('スケジュールを正常に取得できる', async () => {
    const { result } = renderHook(() => useTodaySchedules('user-1'));

    // 初期状態: ローディング中
    expect(result.current.isLoading).toBe(true);
    expect(result.current.schedules).toEqual([]);
    expect(result.current.error).toBeNull();

    // データ取得完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // スケジュールが取得されている
    expect(result.current.schedules.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('エラーが発生した場合、エラー状態を保持する', async () => {
    // リポジトリをモックしてエラーを発生させる
    const mockError = new Error('API Error');
    vi.spyOn(ScheduleRepositoryModule, 'ScheduleRepositoryImpl').mockImplementation(() => {
      return {
        getTodaySchedules: vi.fn().mockRejectedValue(mockError),
        createSchedule: vi.fn(),
        updateSchedule: vi.fn(),
        deleteSchedule: vi.fn(),
        markAsCompleted: vi.fn(),
      } as unknown as ScheduleRepositoryModule.ScheduleRepositoryImpl;
    });

    const { result } = renderHook(() => useTodaySchedules('user-1'));

    // エラー発生まで待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // エラー状態が設定されている
    expect(result.current.error).toBeTruthy();
    expect(result.current.schedules).toEqual([]);
  });

  it('refetchでスケジュールを再取得できる', async () => {
    const { result } = renderHook(() => useTodaySchedules('user-1'));

    // 初回取得完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialSchedules = result.current.schedules;

    // refetchを実行
    await result.current.refetch();

    // スケジュールが再取得されている
    expect(result.current.schedules).toEqual(initialSchedules);
  });

  it('空のスケジュール一覧が返される場合も正常に処理される', async () => {
    // 空のスケジュールを返すモック
    vi.spyOn(ScheduleRepositoryModule, 'ScheduleRepositoryImpl').mockImplementation(() => {
      return {
        getTodaySchedules: vi.fn().mockResolvedValue([]),
        createSchedule: vi.fn(),
        updateSchedule: vi.fn(),
        deleteSchedule: vi.fn(),
        markAsCompleted: vi.fn(),
      } as unknown as ScheduleRepositoryModule.ScheduleRepositoryImpl;
    });

    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
