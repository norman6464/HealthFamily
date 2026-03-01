import { describe, it, expect, vi } from 'vitest';
import { GetTodaySchedules } from '@/domain/usecases/GetTodaySchedules';
import { ScheduleRepository, TodayScheduleItem } from '@/domain/repositories/ScheduleRepository';
import { Schedule } from '@/domain/entities/Schedule';

const createSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sched-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'mem-1',
  scheduledTime: '08:00',
  daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  isEnabled: true,
  reminderMinutesBefore: 10,
  createdAt: new Date(),
  ...overrides,
});

const createScheduleItem = (overrides: Partial<TodayScheduleItem> = {}): TodayScheduleItem => ({
  schedule: createSchedule(),
  medicationName: 'テスト薬',
  memberName: 'テスト太郎',
  memberType: 'human',
  isCompleted: false,
  ...overrides,
});

const createMockRepository = (items: TodayScheduleItem[] = []): ScheduleRepository => ({
  getTodaySchedules: vi.fn().mockResolvedValue(items),
  createSchedule: vi.fn(),
  updateSchedule: vi.fn(),
  deleteSchedule: vi.fn(),
  markAsCompleted: vi.fn(),
});

describe('GetTodaySchedules', () => {
  it('アクティブなスケジュールをViewModelとして返す', async () => {
    const items = [createScheduleItem()];
    const repo = createMockRepository(items);
    const useCase = new GetTodaySchedules(repo);

    // 月曜日を指定
    const monday = new Date('2025-06-02T10:00:00');
    const result = await useCase.execute({ userId: 'user-1', date: monday });

    expect(result).toHaveLength(1);
    expect(result[0].scheduleId).toBe('sched-1');
    expect(result[0].medicationName).toBe('テスト薬');
    expect(result[0].memberName).toBe('テスト太郎');
    expect(result[0].scheduledTime).toBe('08:00');
  });

  it('無効なスケジュールをフィルタリングする', async () => {
    const items = [
      createScheduleItem({
        schedule: createSchedule({ isEnabled: false }),
      }),
    ];
    const repo = createMockRepository(items);
    const useCase = new GetTodaySchedules(repo);

    const monday = new Date('2025-06-02T10:00:00');
    const result = await useCase.execute({ userId: 'user-1', date: monday });

    expect(result).toHaveLength(0);
  });

  it('曜日が一致しないスケジュールをフィルタリングする', async () => {
    const items = [
      createScheduleItem({
        schedule: createSchedule({ daysOfWeek: ['sat', 'sun'] }),
      }),
    ];
    const repo = createMockRepository(items);
    const useCase = new GetTodaySchedules(repo);

    // 月曜日を指定（sat, sunのみ有効なスケジュール）
    const monday = new Date('2025-06-02T10:00:00');
    const result = await useCase.execute({ userId: 'user-1', date: monday });

    expect(result).toHaveLength(0);
  });

  it('時刻順にソートする', async () => {
    const items = [
      createScheduleItem({
        schedule: createSchedule({ id: 'sched-2', scheduledTime: '20:00' }),
      }),
      createScheduleItem({
        schedule: createSchedule({ id: 'sched-1', scheduledTime: '08:00' }),
      }),
      createScheduleItem({
        schedule: createSchedule({ id: 'sched-3', scheduledTime: '12:00' }),
      }),
    ];
    const repo = createMockRepository(items);
    const useCase = new GetTodaySchedules(repo);

    const monday = new Date('2025-06-02T07:00:00');
    const result = await useCase.execute({ userId: 'user-1', date: monday });

    expect(result[0].scheduledTime).toBe('08:00');
    expect(result[1].scheduledTime).toBe('12:00');
    expect(result[2].scheduledTime).toBe('20:00');
  });

  it('完了したスケジュールのステータスをcompletedにする', async () => {
    const items = [
      createScheduleItem({ isCompleted: true }),
    ];
    const repo = createMockRepository(items);
    const useCase = new GetTodaySchedules(repo);

    const monday = new Date('2025-06-02T10:00:00');
    const result = await useCase.execute({ userId: 'user-1', date: monday });

    expect(result[0].status).toBe('completed');
  });

  it('予定時刻を過ぎた未完了スケジュールのステータスをoverdueにする', async () => {
    const items = [
      createScheduleItem({
        schedule: createSchedule({ scheduledTime: '08:00' }),
        isCompleted: false,
      }),
    ];
    const repo = createMockRepository(items);
    const useCase = new GetTodaySchedules(repo);

    // 10:00に確認（08:00は過ぎている）
    const monday = new Date('2025-06-02T10:00:00');
    const result = await useCase.execute({ userId: 'user-1', date: monday });

    expect(result[0].status).toBe('overdue');
  });

  it('予定時刻前の未完了スケジュールのステータスをpendingにする', async () => {
    const items = [
      createScheduleItem({
        schedule: createSchedule({ scheduledTime: '14:00' }),
        isCompleted: false,
      }),
    ];
    const repo = createMockRepository(items);
    const useCase = new GetTodaySchedules(repo);

    // 10:00に確認（14:00はまだ来ていない）
    const monday = new Date('2025-06-02T10:00:00');
    const result = await useCase.execute({ userId: 'user-1', date: monday });

    expect(result[0].status).toBe('pending');
  });

  it('空のスケジュール一覧を正しく処理する', async () => {
    const repo = createMockRepository([]);
    const useCase = new GetTodaySchedules(repo);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toHaveLength(0);
  });
});
