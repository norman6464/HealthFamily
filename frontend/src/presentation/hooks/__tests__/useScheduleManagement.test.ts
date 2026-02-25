import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScheduleManagement } from '../useScheduleManagement';
import * as scheduleApiModule from '../../../data/api/scheduleApi';

describe('useScheduleManagement Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態が正しい', () => {
    const { result } = renderHook(() => useScheduleManagement());

    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.createSchedule).toBe('function');
  });

  it('スケジュール作成中にisCreatingがtrueになる', async () => {
    // createScheduleをresolveさせないようにして、isCreating状態をテスト
    vi.spyOn(scheduleApiModule.scheduleApi, 'createSchedule').mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useScheduleManagement());

    let createPromise: Promise<void>;
    act(() => {
      createPromise = result.current.createSchedule({
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'member-1',
        scheduledTime: '08:00',
        daysOfWeek: ['mon', 'tue', 'wed'],
        reminderMinutesBefore: 10,
      });
    });

    expect(result.current.isCreating).toBe(true);

    await act(async () => {
      await createPromise!;
    });

    expect(result.current.isCreating).toBe(false);
  });

  it('スケジュール作成エラー時にerror状態が設定される', async () => {
    vi.spyOn(scheduleApiModule.scheduleApi, 'createSchedule').mockRejectedValue(
      new Error('作成に失敗しました')
    );

    const { result } = renderHook(() => useScheduleManagement());

    await act(async () => {
      await result.current.createSchedule({
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'member-1',
        scheduledTime: '08:00',
        daysOfWeek: ['mon'],
        reminderMinutesBefore: 5,
      });
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error?.message).toBe('作成に失敗しました');
    expect(result.current.isCreating).toBe(false);
  });

  it('正しいデータでリポジトリが呼ばれる', async () => {
    const createSpy = vi.spyOn(scheduleApiModule.scheduleApi, 'createSchedule').mockResolvedValue({
      id: 'new-schedule',
      medicationId: 'med-1',
      userId: 'user-1',
      memberId: 'member-1',
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'tue'],
      isEnabled: true,
      reminderMinutesBefore: 10,
      createdAt: new Date(),
    });

    const { result } = renderHook(() => useScheduleManagement());

    await act(async () => {
      await result.current.createSchedule({
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'member-1',
        scheduledTime: '08:00',
        daysOfWeek: ['mon', 'tue'],
        reminderMinutesBefore: 10,
      });
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'member-1',
        scheduledTime: '08:00',
        isEnabled: true,
      })
    );
  });
});
