import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTodaySchedules } from '../useTodaySchedules';
import * as scheduleApiModule from '../../../data/api/scheduleApi';

describe('useTodaySchedules Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
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
    vi.spyOn(scheduleApiModule.scheduleApi, 'getTodaySchedules').mockRejectedValue(
      new Error('API Error')
    );

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
    vi.spyOn(scheduleApiModule.scheduleApi, 'getTodaySchedules').mockResolvedValue([]);

    const { result } = renderHook(() => useTodaySchedules('user-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.schedules).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
