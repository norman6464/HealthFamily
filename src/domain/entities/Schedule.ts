/**
 * スケジュールエンティティ
 * ビジネスロジックの中核となるドメインモデル
 */

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type ScheduleStatus = 'pending' | 'completed' | 'overdue';
export type OverdueLevel = 'none' | 'warning' | 'danger';

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

    // 曜日が未設定（空配列）の場合は毎日有効
    if (this.schedule.daysOfWeek.length === 0) {
      return true;
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

  /**
   * 他のスケジュールと時刻・曜日が重複しているかチェック
   */
  hasOverlap(other: Schedule): boolean {
    if (this.schedule.medicationId !== other.medicationId) return false;
    if (this.schedule.scheduledTime !== other.scheduledTime) return false;

    // 曜日が空（毎日）の場合は常に重複
    if (this.schedule.daysOfWeek.length === 0 || other.daysOfWeek.length === 0) {
      return true;
    }

    return this.schedule.daysOfWeek.some((day) => other.daysOfWeek.includes(day));
  }

  /**
   * 飲み忘れの深刻度を取得
   * 30分以上: warning, 1時間以上: danger
   */
  getOverdueLevel(currentTime: Date, isCompleted: boolean): OverdueLevel {
    if (isCompleted) return 'none';

    const [hours, minutes] = this.schedule.scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(currentTime);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const diffMs = currentTime.getTime() - scheduledDateTime.getTime();
    if (diffMs <= 0) return 'none';

    const diffMinutes = diffMs / (1000 * 60);
    if (diffMinutes >= 60) return 'danger';
    if (diffMinutes >= 30) return 'warning';
    return 'none';
  }

  /**
   * 飲み忘れの経過時間を取得（分）
   */
  getOverdueMinutes(currentTime: Date): number {
    const [hours, minutes] = this.schedule.scheduledTime.split(':').map(Number);
    const scheduledDateTime = new Date(currentTime);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const diffMs = currentTime.getTime() - scheduledDateTime.getTime();
    if (diffMs <= 0) return 0;
    return Math.floor(diffMs / (1000 * 60));
  }

  /**
   * 飲み忘れレベルに応じたスタイルクラスを取得
   */
  static getOverdueLevelStyle(level: OverdueLevel): { bg: string; text: string; border: string } {
    switch (level) {
      case 'danger':
        return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-300' };
      case 'warning':
        return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-300' };
      default:
        return { bg: '', text: '', border: '' };
    }
  }

  get id(): string {
    return this.schedule.id;
  }

  get data(): Schedule {
    return this.schedule;
  }
}
