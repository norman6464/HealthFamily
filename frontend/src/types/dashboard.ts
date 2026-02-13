import { DayOfWeek } from './schedule';

export type ScheduleStatus = 'pending' | 'completed' | 'overdue';
export type MemberType = 'human' | 'pet';

/**
 * ダッシュボード用の今日のスケジュール表示データ
 */
export interface TodayScheduleItem {
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  userId: string;
  memberId: string;
  memberName: string;
  memberType: MemberType;
  scheduledTime: string; // HH:mm 形式
  status: ScheduleStatus;
  daysOfWeek: readonly DayOfWeek[];
  isEnabled: boolean;
  reminderMinutesBefore: number;
  createdAt: string;
}
