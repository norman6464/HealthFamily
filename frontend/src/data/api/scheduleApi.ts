/**
 * スケジュールAPI クライアント
 * 実際のAPIエンドポイントとの通信を担当（現在はモック）
 */

import { Schedule } from '../../domain/entities/Schedule';
import { TodayScheduleItem } from '../../domain/repositories/ScheduleRepository';

// モックデータ（後でAPI連携に置き換え）
const mockSchedules: TodayScheduleItem[] = [
  {
    schedule: {
      id: '1',
      medicationId: 'med-1',
      userId: 'user-1',
      memberId: 'member-1',
      scheduledTime: '08:00',
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
      isEnabled: true,
      reminderMinutesBefore: 10,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    medicationName: '血圧の薬',
    memberName: 'パパ',
    memberType: 'human',
    isCompleted: true,
  },
  {
    schedule: {
      id: '2',
      medicationId: 'med-2',
      userId: 'user-1',
      memberId: 'member-2',
      scheduledTime: '12:00',
      daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      isEnabled: true,
      reminderMinutesBefore: 30,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    medicationName: '胃薬',
    memberName: 'ママ',
    memberType: 'human',
    isCompleted: false,
  },
  {
    schedule: {
      id: '3',
      medicationId: 'med-3',
      userId: 'user-1',
      memberId: 'member-3',
      scheduledTime: '18:00',
      daysOfWeek: ['mon', 'wed', 'fri'],
      isEnabled: true,
      reminderMinutesBefore: 15,
      createdAt: new Date('2024-01-01T00:00:00Z'),
    },
    medicationName: 'フィラリア薬',
    memberName: 'ポチ',
    memberType: 'pet',
    isCompleted: false,
  },
];

export const scheduleApi = {
  /**
   * 今日のスケジュールを取得
   */
  async getTodaySchedules(_userId: string, _date: Date): Promise<TodayScheduleItem[]> {
    // 実際のAPI呼び出しをシミュレート
    await new Promise((resolve) => setTimeout(resolve, 500));

    // TODO: 実際のAPIエンドポイントに置き換え
    // const response = await fetch(`/api/schedules/today?userId=${userId}&date=${date.toISOString()}`);
    // return await response.json();

    return mockSchedules;
  },

  /**
   * スケジュールを作成
   */
  async createSchedule(
    _schedule: Omit<Schedule, 'id' | 'createdAt'>
  ): Promise<Schedule> {
    // TODO: 実際のAPIエンドポイントに置き換え
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error('Not implemented');
  },

  /**
   * スケジュールを更新
   */
  async updateSchedule(_id: string, _schedule: Partial<Schedule>): Promise<Schedule> {
    // TODO: 実際のAPIエンドポイントに置き換え
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error('Not implemented');
  },

  /**
   * スケジュールを削除
   */
  async deleteSchedule(_id: string): Promise<void> {
    // TODO: 実際のAPIエンドポイントに置き換え
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error('Not implemented');
  },

  /**
   * スケジュールを服薬完了にする
   */
  async markAsCompleted(_scheduleId: string, _completedAt: Date): Promise<void> {
    // TODO: 実際のAPIエンドポイントに置き換え
    await new Promise((resolve) => setTimeout(resolve, 300));
    throw new Error('Not implemented');
  },
};
