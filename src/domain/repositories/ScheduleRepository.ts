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
  medicationDisplayOrder: number;
  isCompleted: boolean;
}

export interface ScheduleWithDetails {
  schedule: Schedule;
  medicationName: string;
  memberName: string;
}

export interface MissedDose {
  date: string;
  scheduleId: string;
  medicationName: string;
  memberName: string;
  memberId: string;
  scheduledTime: string;
}

export interface ScheduleRepository {
  /**
   * IDでスケジュールを取得（所有権確認用）
   */
  findById(id: string): Promise<{ userId: string } | null>;

  /**
   * 全スケジュール一覧を取得（薬名・メンバー名付き）
   */
  getSchedules(): Promise<ScheduleWithDetails[]>;

  /**
   * ユーザーの全スケジュールを取得（生データ）
   */
  getSchedulesRaw(): Promise<Schedule[]>;

  /**
   * 今日のスケジュール一覧を取得
   */
  getTodaySchedules(query: TodayScheduleQuery): Promise<TodayScheduleItem[]>;

  /**
   * 同じ薬・同じ時刻の有効なスケジュールを検索（重複チェック用）
   */
  findOverlapping(medicationId: string, scheduledTime: string): Promise<Schedule | null>;

  /**
   * スケジュールを作成
   */
  createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>): Promise<Schedule>;

  /**
   * スケジュールを更新
   */
  updateSchedule(id: string, schedule: Partial<Schedule>, options?: { clearInterval?: boolean }): Promise<Schedule>;

  /**
   * スケジュールを削除
   */
  deleteSchedule(id: string): Promise<void>;

  /**
   * スケジュールを服薬完了にする
   */
  markAsCompleted(scheduleId: string, completedAt: Date, options?: { takenAt?: string; notes?: string }): Promise<void>;

  /**
   * 過去7日間の飲み忘れスケジュールを取得
   */
  getMissedDoses(): Promise<MissedDose[]>;
}
