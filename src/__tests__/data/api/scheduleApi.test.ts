import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scheduleApi } from '@/data/api/scheduleApi';
import { apiClient } from '@/data/api/apiClient';
import { BackendSchedule, BackendMember, BackendMedication } from '@/data/api/types';

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

const mockMember: BackendMember = {
  id: 'member-1',
  userId: 'user-1',
  name: '太郎',
  memberType: 'human',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const mockMedication: BackendMedication = {
  id: 'med-1',
  memberId: 'member-1',
  userId: 'user-1',
  name: '頭痛薬',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

describe('scheduleApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSchedulesでスケジュール一覧を詳細付きで取得する', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([mockSchedule])
      .mockResolvedValueOnce([mockMember])
      .mockResolvedValueOnce(mockMedication);

    const result = await scheduleApi.getSchedules();
    expect(result).toHaveLength(1);
    expect(result[0].medicationName).toBe('頭痛薬');
    expect(result[0].memberName).toBe('太郎');
    expect(result[0].schedule.scheduledTime).toBe('08:00');
  });

  it('getSchedulesで薬が見つからないスケジュールを除外する', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce([mockSchedule])
      .mockResolvedValueOnce([mockMember])
      .mockRejectedValueOnce(new Error('Not found'));

    const result = await scheduleApi.getSchedules();
    expect(result).toHaveLength(0);
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
