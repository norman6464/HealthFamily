import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleApi } from '@/data/api/scheduleApi';
import { apiClient } from '@/data/api/apiClient';
import { BackendSchedule } from '@/data/api/types';

vi.mock('@/data/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

const mockSchedule: BackendSchedule = {
  id: 'sch-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'member-1',
  scheduledTime: '08:00',
  daysOfWeek: ['mon', 'wed', 'fri'],
  isEnabled: true,
  reminderMinutesBefore: 10,
  createdAt: '2025-01-01T00:00:00.000Z',
};

const mockTodayResponse = {
  id: 'sch-1',
  medicationId: 'med-1',
  medicationName: '頭痛薬',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  memberType: 'human',
  scheduledTime: '08:00',
  daysOfWeek: ['mon', 'wed', 'fri'],
  isEnabled: true,
  reminderMinutesBefore: 10,
  isCompleted: false,
  createdAt: '2025-01-01T00:00:00.000Z',
};

describe('scheduleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSchedulesでスケジュール一覧を詳細付きで取得する', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([mockTodayResponse]);

    const result = await scheduleApi.getSchedules();
    expect(apiClient.get).toHaveBeenCalledWith('/schedules/all');
    expect(result).toHaveLength(1);
    expect(result[0].medicationName).toBe('頭痛薬');
    expect(result[0].memberName).toBe('太郎');
    expect(result[0].schedule.scheduledTime).toBe('08:00');
  });

  it('getTodaySchedulesでサーバーサイドから今日のスケジュールを取得する', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([mockTodayResponse]);

    const result = await scheduleApi.getTodaySchedules('user-1', new Date());
    expect(apiClient.get).toHaveBeenCalledWith('/schedules/today');
    expect(result).toHaveLength(1);
    expect(result[0].medicationName).toBe('頭痛薬');
    expect(result[0].memberName).toBe('太郎');
    expect(result[0].memberType).toBe('human');
    expect(result[0].isCompleted).toBe(false);
  });

  it('createScheduleでスケジュールを作成する', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(mockSchedule);
    const result = await scheduleApi.createSchedule({
      medicationId: 'med-1',
      userId: 'user-1',
      memberId: 'member-1',
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'wed', 'fri'],
      isEnabled: true,
      reminderMinutesBefore: 10,
    });
    expect(apiClient.post).toHaveBeenCalledWith('/schedules', expect.objectContaining({ scheduledTime: '08:00' }));
    expect(result.scheduledTime).toBe('08:00');
  });

  it('updateScheduleでスケジュールを更新する', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ ...mockSchedule, scheduledTime: '09:00' });
    const result = await scheduleApi.updateSchedule('sch-1', { scheduledTime: '09:00' });
    expect(apiClient.put).toHaveBeenCalledWith('/schedules/sch-1', { scheduledTime: '09:00' });
    expect(result.scheduledTime).toBe('09:00');
  });

  it('deleteScheduleでスケジュールを削除する', async () => {
    vi.mocked(apiClient.del).mockResolvedValue(undefined);
    await scheduleApi.deleteSchedule('sch-1');
    expect(apiClient.del).toHaveBeenCalledWith('/schedules/sch-1');
  });

  it('markAsCompletedで服薬記録を作成する', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(mockSchedule);
    vi.mocked(apiClient.post).mockResolvedValue({});
    await scheduleApi.markAsCompleted('sch-1', new Date());
    expect(apiClient.post).toHaveBeenCalledWith('/records', {
      memberId: 'member-1',
      medicationId: 'med-1',
      scheduleId: 'sch-1',
    });
  });

  it('markAsCompletedでスケジュールが見つからない場合は何もしない', async () => {
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));
    await scheduleApi.markAsCompleted('invalid', new Date());
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
