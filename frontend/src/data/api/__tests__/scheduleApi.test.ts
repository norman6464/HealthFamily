import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleApi } from '../scheduleApi';
import { apiClient } from '../apiClient';

vi.mock('../apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    del: vi.fn(),
  },
}));

const backendSchedule = {
  scheduleId: 'sch-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'mem-1',
  scheduledTime: '08:00',
  daysOfWeek: ['mon', 'tue'],
  isEnabled: true,
  reminderMinutesBefore: 10,
  createdAt: '2024-01-01T00:00:00Z',
};

const backendMember = {
  memberId: 'mem-1',
  userId: 'user-1',
  name: 'パパ',
  memberType: 'human',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const backendMedication = {
  medicationId: 'med-1',
  memberId: 'mem-1',
  userId: 'user-1',
  name: '血圧の薬',
  category: 'regular',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('scheduleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getTodaySchedulesでスケジュール一覧を取得できる', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([backendSchedule]) // /schedules
      .mockResolvedValueOnce([backendMember]) // /members
      .mockResolvedValueOnce([]) // /records
      .mockResolvedValueOnce(backendMedication); // /medications/:id

    const result = await scheduleApi.getTodaySchedules('user-1', new Date());

    expect(result).toHaveLength(1);
    expect(result[0].schedule.id).toBe('sch-1');
    expect(result[0].medicationName).toBe('血圧の薬');
    expect(result[0].memberName).toBe('パパ');
    expect(result[0].memberType).toBe('human');
    expect(result[0].isCompleted).toBe(false);
  });

  it('getTodaySchedulesで服薬記録がある場合isCompletedがtrueになる', async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([backendSchedule])
      .mockResolvedValueOnce([backendMember])
      .mockResolvedValueOnce([{ recordId: 'rec-1', scheduleId: 'sch-1', takenAt: `${todayStr}T08:00:00Z`, memberId: 'mem-1', medicationId: 'med-1', userId: 'user-1' }])
      .mockResolvedValueOnce(backendMedication);

    const result = await scheduleApi.getTodaySchedules('user-1', new Date());

    expect(result[0].isCompleted).toBe(true);
  });

  it('getTodaySchedulesで無効なスケジュールを除外する', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([{ ...backendSchedule, isEnabled: false }])
      .mockResolvedValueOnce([backendMember])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(backendMedication);

    const result = await scheduleApi.getTodaySchedules('user-1', new Date());

    expect(result).toHaveLength(0);
  });

  it('createScheduleでスケジュールを作成できる', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(backendSchedule);

    const result = await scheduleApi.createSchedule({
      medicationId: 'med-1',
      userId: 'user-1',
      memberId: 'mem-1',
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'tue'],
      isEnabled: true,
      reminderMinutesBefore: 10,
    });

    expect(apiClient.post).toHaveBeenCalledWith('/schedules', {
      medicationId: 'med-1',
      memberId: 'mem-1',
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'tue'],
      isEnabled: true,
      reminderMinutesBefore: 10,
    });
    expect(result.id).toBe('sch-1');
  });

  it('updateScheduleでスケジュールを更新できる', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce({
      ...backendSchedule,
      scheduledTime: '09:00',
    });

    const result = await scheduleApi.updateSchedule('sch-1', {
      scheduledTime: '09:00',
      daysOfWeek: ['mon'],
      isEnabled: false,
      reminderMinutesBefore: 5,
    });

    expect(apiClient.put).toHaveBeenCalledWith('/schedules/sch-1', {
      scheduledTime: '09:00',
      daysOfWeek: ['mon'],
      isEnabled: false,
      reminderMinutesBefore: 5,
    });
    expect(result.id).toBe('sch-1');
  });

  it('deleteScheduleでスケジュールを削除できる', async () => {
    vi.mocked(apiClient.del).mockResolvedValueOnce(undefined);

    await scheduleApi.deleteSchedule('sch-1');

    expect(apiClient.del).toHaveBeenCalledWith('/schedules/sch-1');
  });

  it('markAsCompletedで服薬記録を作成できる', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce(backendSchedule);
    vi.mocked(apiClient.post).mockResolvedValueOnce({});

    await scheduleApi.markAsCompleted('sch-1', new Date());

    expect(apiClient.get).toHaveBeenCalledWith('/schedules/sch-1');
    expect(apiClient.post).toHaveBeenCalledWith('/records', {
      memberId: 'mem-1',
      medicationId: 'med-1',
      scheduleId: 'sch-1',
    });
  });

  it('markAsCompletedでスケジュールが見つからない場合何もしない', async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error('Not found'));

    await scheduleApi.markAsCompleted('nonexistent', new Date());

    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
