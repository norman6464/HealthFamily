import { describe, it, expect, beforeEach } from 'vitest';
import { GetTodaySchedules } from '../GetTodaySchedules';
import {
  ScheduleRepository,
  TodayScheduleItem,
  TodayScheduleQuery,
} from '../../repositories/ScheduleRepository';
import { Schedule } from '../../entities/Schedule';

// モックリポジトリ
class MockScheduleRepository implements ScheduleRepository {
  private mockData: TodayScheduleItem[] = [];

  setMockData(data: TodayScheduleItem[]): void {
    this.mockData = data;
  }

  async getTodaySchedules(_query: TodayScheduleQuery): Promise<TodayScheduleItem[]> {
    return this.mockData;
  }

  async createSchedule(_schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule> {
    throw new Error('Not implemented');
  }

  async updateSchedule(_id: string, _schedule: Partial<Schedule>): Promise<Schedule> {
    throw new Error('Not implemented');
  }

  async deleteSchedule(_id: string): Promise<void> {
    throw new Error('Not implemented');
  }

  async markAsCompleted(_scheduleId: string, _completedAt: Date): Promise<void> {
    throw new Error('Not implemented');
  }
}

describe('GetTodaySchedules UseCase', () => {
  let useCase: GetTodaySchedules;
  let mockRepository: MockScheduleRepository;

  beforeEach(() => {
    mockRepository = new MockScheduleRepository();
    useCase = new GetTodaySchedules(mockRepository);
  });

  it('今日のスケジュールを取得できる', async () => {
    // モックデータを設定
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

    mockRepository.setMockData([
      {
        schedule: mockSchedule,
        medicationName: '血圧の薬',
        memberName: 'テストユーザー',
        memberType: 'human',
        isCompleted: false,
      },
    ]);

    // 月曜日を想定
    const testDate = new Date('2024-01-01T10:00:00');

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      scheduleId: 'schedule-1',
      medicationName: '血圧の薬',
      memberName: 'テストユーザー',
      status: 'overdue', // 10:00なので08:00のスケジュールはoverdue
    });
  });

  it('有効でないスケジュールはフィルタされる', async () => {
    const mockSchedule: Schedule = {
      id: 'schedule-1',
      medicationId: 'med-1',
      userId: 'user-1',
      memberId: 'member-1',
      scheduledTime: '08:00',
      daysOfWeek: ['mon'],
      isEnabled: false, // 無効
      reminderMinutesBefore: 10,
      createdAt: new Date('2024-01-01'),
    };

    mockRepository.setMockData([
      {
        schedule: mockSchedule,
        medicationName: '血圧の薬',
        memberName: 'テストユーザー',
        memberType: 'human',
        isCompleted: false,
      },
    ]);

    // 月曜日
    const testDate = new Date('2024-01-01T07:00:00');

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate,
    });

    // 無効なスケジュールはフィルタされる
    expect(result).toHaveLength(0);
  });

  it('該当しない曜日のスケジュールはフィルタされる', async () => {
    const mockSchedule: Schedule = {
      id: 'schedule-1',
      medicationId: 'med-1',
      userId: 'user-1',
      memberId: 'member-1',
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'tue', 'wed'], // 月火水のみ
      isEnabled: true,
      reminderMinutesBefore: 10,
      createdAt: new Date('2024-01-01'),
    };

    mockRepository.setMockData([
      {
        schedule: mockSchedule,
        medicationName: '血圧の薬',
        memberName: 'テストユーザー',
        memberType: 'human',
        isCompleted: false,
      },
    ]);

    // 土曜日を想定
    const testDate = new Date('2024-01-06T07:00:00');

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate,
    });

    // 土曜日は含まれないのでフィルタされる
    expect(result).toHaveLength(0);
  });

  it('複数のスケジュールが時刻順にソートされる', async () => {
    const schedule1: Schedule = {
      id: 'schedule-1',
      medicationId: 'med-1',
      userId: 'user-1',
      memberId: 'member-1',
      scheduledTime: '18:00',
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      isEnabled: true,
      reminderMinutesBefore: 10,
      createdAt: new Date('2024-01-01'),
    };

    const schedule2: Schedule = {
      id: 'schedule-2',
      medicationId: 'med-2',
      userId: 'user-1',
      memberId: 'member-2',
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      isEnabled: true,
      reminderMinutesBefore: 10,
      createdAt: new Date('2024-01-01'),
    };

    const schedule3: Schedule = {
      id: 'schedule-3',
      medicationId: 'med-3',
      userId: 'user-1',
      memberId: 'member-3',
      scheduledTime: '12:00',
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      isEnabled: true,
      reminderMinutesBefore: 10,
      createdAt: new Date('2024-01-01'),
    };

    mockRepository.setMockData([
      {
        schedule: schedule1,
        medicationName: '薬C',
        memberName: 'ユーザーC',
        memberType: 'human',
        isCompleted: false,
      },
      {
        schedule: schedule2,
        medicationName: '薬A',
        memberName: 'ユーザーA',
        memberType: 'human',
        isCompleted: false,
      },
      {
        schedule: schedule3,
        medicationName: '薬B',
        memberName: 'ユーザーB',
        memberType: 'human',
        isCompleted: false,
      },
    ]);

    const testDate = new Date('2024-01-01T07:00:00');

    const result = await useCase.execute({
      userId: 'user-1',
      date: testDate,
    });

    expect(result).toHaveLength(3);
    // 時刻順にソートされる: 08:00 -> 12:00 -> 18:00
    expect(result[0].scheduledTime).toBe('08:00');
    expect(result[1].scheduledTime).toBe('12:00');
    expect(result[2].scheduledTime).toBe('18:00');
  });

  it('ステータスが正しく計算される（pending/completed/overdue）', async () => {
    const schedule: Schedule = {
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

    // Pending: 現在時刻が予定時刻より前
    mockRepository.setMockData([
      {
        schedule,
        medicationName: '血圧の薬',
        memberName: 'テストユーザー',
        memberType: 'human',
        isCompleted: false,
      },
    ]);

    let result = await useCase.execute({
      userId: 'user-1',
      date: new Date('2024-01-01T07:00:00'),
    });
    expect(result[0].status).toBe('pending');

    // Overdue: 現在時刻が予定時刻より後
    result = await useCase.execute({
      userId: 'user-1',
      date: new Date('2024-01-01T09:00:00'),
    });
    expect(result[0].status).toBe('overdue');

    // Completed: 既に服薬済み
    mockRepository.setMockData([
      {
        schedule,
        medicationName: '血圧の薬',
        memberName: 'テストユーザー',
        memberType: 'human',
        isCompleted: true,
      },
    ]);

    result = await useCase.execute({
      userId: 'user-1',
      date: new Date('2024-01-01T09:00:00'),
    });
    expect(result[0].status).toBe('completed');
  });
});
