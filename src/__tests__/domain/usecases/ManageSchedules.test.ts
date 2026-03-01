import { describe, it, expect, vi } from 'vitest';
import { GetSchedules, UpdateSchedule, DeleteSchedule } from '@/domain/usecases/ManageSchedules';
import { ScheduleRepository, ScheduleWithDetails } from '@/domain/repositories/ScheduleRepository';
import { Schedule } from '@/domain/entities/Schedule';

const mockSchedule: Schedule = {
  id: 'sch-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'member-1',
  scheduledTime: '08:00',
  daysOfWeek: ['mon', 'wed', 'fri'],
  isEnabled: true,
  reminderMinutesBefore: 10,
  createdAt: new Date(),
};

const mockScheduleWithDetails: ScheduleWithDetails = {
  schedule: mockSchedule,
  medicationName: 'テスト薬',
  memberName: 'テスト太郎',
};

const createMockRepository = (): ScheduleRepository => ({
  getSchedules: vi.fn().mockResolvedValue([mockScheduleWithDetails]),
  getTodaySchedules: vi.fn().mockResolvedValue([]),
  createSchedule: vi.fn().mockResolvedValue(mockSchedule),
  updateSchedule: vi.fn().mockResolvedValue(mockSchedule),
  deleteSchedule: vi.fn().mockResolvedValue(undefined),
  markAsCompleted: vi.fn().mockResolvedValue(undefined),
});

describe('GetSchedules', () => {
  it('全スケジュールを詳細付きで取得する', async () => {
    const repo = createMockRepository();
    const useCase = new GetSchedules(repo);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].schedule).toBe(mockSchedule);
    expect(result[0].medicationName).toBe('テスト薬');
    expect(result[0].memberName).toBe('テスト太郎');
    expect(repo.getSchedules).toHaveBeenCalled();
  });

  it('リポジトリがエラーを投げた場合そのまま伝搬する', async () => {
    const repo = createMockRepository();
    (repo.getSchedules as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('DB接続エラー'));
    const useCase = new GetSchedules(repo);

    await expect(useCase.execute()).rejects.toThrow('DB接続エラー');
  });
});

describe('UpdateSchedule', () => {
  it('スケジュールを更新する', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateSchedule(repo);
    const result = await useCase.execute('sch-1', { scheduledTime: '09:00' });

    expect(result).toBe(mockSchedule);
    expect(repo.updateSchedule).toHaveBeenCalledWith('sch-1', { scheduledTime: '09:00' });
  });

  it('スケジュールIDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateSchedule(repo);

    await expect(
      useCase.execute('', { scheduledTime: '09:00' })
    ).rejects.toThrow('スケジュールIDは必須です');
  });

  it('更新フィールドが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateSchedule(repo);

    await expect(
      useCase.execute('sch-1', {})
    ).rejects.toThrow('更新するフィールドがありません');
  });

  it('有効/無効の切り替えができる', async () => {
    const repo = createMockRepository();
    const useCase = new UpdateSchedule(repo);
    await useCase.execute('sch-1', { isEnabled: false });

    expect(repo.updateSchedule).toHaveBeenCalledWith('sch-1', { isEnabled: false });
  });
});

describe('DeleteSchedule', () => {
  it('スケジュールを削除する', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteSchedule(repo);
    await useCase.execute('sch-1');

    expect(repo.deleteSchedule).toHaveBeenCalledWith('sch-1');
  });

  it('スケジュールIDが空の場合エラーを投げる', async () => {
    const repo = createMockRepository();
    const useCase = new DeleteSchedule(repo);

    await expect(useCase.execute('')).rejects.toThrow('スケジュールIDは必須です');
  });
});
