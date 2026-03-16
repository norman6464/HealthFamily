import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScheduleManagement } from '@/presentation/hooks/useScheduleManagement';
import { setDIContainer, resetDIContainer, DIContainer } from '@/infrastructure/DIContainer';

const mockRepository = {
  getSchedules: vi.fn(),
  getScheduleById: vi.fn(),
  createSchedule: vi.fn().mockResolvedValue({ id: 'sch-new' }),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  getTodaySchedules: vi.fn(),
  markAsCompleted: vi.fn(),
};

describe('useScheduleManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDIContainer({
      scheduleRepository: mockRepository,
    } as unknown as DIContainer);
  });

  afterEach(() => {
    resetDIContainer();
  });

  it('初期状態でisCreatingがfalseでerrorがnullである', () => {
    const { result } = renderHook(() => useScheduleManagement());

    expect(result.current.isCreating).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('createScheduleでスケジュールを作成する', async () => {
    const { result } = renderHook(() => useScheduleManagement());

    await act(async () => {
      await result.current.createSchedule({
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'member-1',
        scheduledTime: '08:00',
        daysOfWeek: [],
        reminderMinutesBefore: 10,
      });
    });

    expect(mockRepository.createSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        medicationId: 'med-1',
        scheduledTime: '08:00',
        isEnabled: true,
      })
    );
    expect(result.current.isCreating).toBe(false);
  });

  it('作成エラー時にerrorを設定する', async () => {
    mockRepository.createSchedule.mockRejectedValueOnce(new Error('作成失敗'));
    const { result } = renderHook(() => useScheduleManagement());

    await act(async () => {
      await result.current.createSchedule({
        medicationId: 'med-1',
        userId: 'user-1',
        memberId: 'member-1',
        scheduledTime: '08:00',
        daysOfWeek: [],
        reminderMinutesBefore: 10,
      });
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.isCreating).toBe(false);
  });
});
