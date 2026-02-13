/**
 * スケジュールリポジトリインターフェース
 * 依存関係逆転の原則（DIP）に従い、Domain層がData層に依存しない
 */

import { Schedule } from '../entities/Schedule';

export interface TodayScheduleQuery {
  userId: string;
  date: Date;
}

export interface TodayScheduleItem {
  schedule: Schedule;
  medicationName: string;
  memberName: string;
  memberType: 'human' | 'pet';
  isCompleted: boolean;
}

export interface ScheduleRepository {
  /**
   * 今日のスケジュール一覧を取得
   */
  getTodaySchedules(query: TodayScheduleQuery): Promise<TodayScheduleItem[]>;

  /**
   * スケジュールを作成
   */
  createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule>;

  /**
   * スケジュールを更新
   */
  updateSchedule(id: string, schedule: Partial<Schedule>): Promise<Schedule>;

  /**
   * スケジュールを削除
   */
  deleteSchedule(id: string): Promise<void>;

  /**
   * スケジュールを服薬完了にする
   */
  markAsCompleted(scheduleId: string, completedAt: Date): Promise<void>;
}
