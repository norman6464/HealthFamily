/**
 * スケジュールエンティティ
 * ビジネスロジックの中核となるドメインモデル
 */

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type ScheduleStatus = 'pending' | 'completed' | 'overdue';

export interface Schedule {
  readonly id: string;
  readonly medicationId: string;
  readonly userId: string;
  readonly memberId: string;
  readonly scheduledTime: string; // HH:mm形式
  readonly daysOfWeek: readonly DayOfWeek[];
  readonly isEnabled: boolean;
  readonly reminderMinutesBefore: number;
  readonly createdAt: Date;
}

/**
 * スケジュールのステータスを計算するドメインロジック
 */
export class ScheduleEntity {
  constructor(private readonly schedule: Schedule) {}

  /**
   * 現在時刻に基づいてスケジュールのステータスを取得
   */
  getStatus(currentTime: Date, isCompleted: boolean): ScheduleStatus {
    if (isCompleted) {
      return 'completed';
    }

    const [hours, minutes] = this.schedule.scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(currentTime);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    if (currentTime > scheduledDateTime) {
      return 'overdue';
    }

    return 'pending';
  }

  /**
   * 指定された曜日にスケジュールが有効かチェック
   */
  isActiveOnDay(date: Date): boolean {
    if (!this.schedule.isEnabled) {
      return false;
    }

    const dayMap: Record<number, DayOfWeek> = {
      0: 'sun',
      1: 'mon',
      2: 'tue',
      3: 'wed',
      4: 'thu',
      5: 'fri',
      6: 'sat',
    };

    const dayOfWeek = dayMap[date.getDay()];
    return this.schedule.daysOfWeek.includes(dayOfWeek);
  }

  /**
   * リマインダーを送信すべき時刻を取得
   */
  getReminderTime(date: Date): Date {
    const [hours, minutes] = this.schedule.scheduledTime.split(':').map(Number);
    const reminderTime = new Date(date);
    reminderTime.setHours(hours, minutes, 0, 0);
    reminderTime.setMinutes(reminderTime.getMinutes() - this.schedule.reminderMinutesBefore);
    return reminderTime;
  }

  get id(): string {
    return this.schedule.id;
  }

  get data(): Schedule {
    return this.schedule;
  }
}
