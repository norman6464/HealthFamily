/**
 * スケジュールエンティティ
 * ビジネスロジックの中核となるドメインモデル
 */

import { MathHelper } from './MathHelper';

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type ScheduleStatus = 'pending' | 'completed' | 'overdue';
export type OverdueLevel = 'none' | 'warning' | 'danger';
export type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimePeriodGroup<T> {
  period: TimePeriod;
  label: string;
  schedules: T[];
}

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

  private getScheduledDateTime(baseTime: Date): Date {
    const [hours, minutes] = this.schedule.scheduledTime.split(':').map(Number);
    const dt = new Date(baseTime);
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  }

  /**
   * 現在時刻に基づいてスケジュールのステータスを取得
   */
  getStatus(currentTime: Date, isCompleted: boolean): ScheduleStatus {
    if (isCompleted) {
      return 'completed';
    }

    const scheduledDateTime = this.getScheduledDateTime(currentTime);

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
    const reminderTime = this.getScheduledDateTime(date);
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

    const scheduledDateTime = this.getScheduledDateTime(currentTime);

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
    const scheduledDateTime = this.getScheduledDateTime(currentTime);

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

  /**
   * 時刻文字列(HH:mm)から時間帯を判定
   */
  static getTimePeriod(time: string): TimePeriod {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * 時間帯の日本語ラベルを取得
   */
  static getTimePeriodLabel(period: TimePeriod): string {
    const labels: Record<TimePeriod, string> = {
      morning: '朝',
      afternoon: '昼',
      evening: '夕',
      night: '夜',
    };
    return labels[period];
  }

  /**
   * スケジュールを時間帯別にグループ化
   */
  static groupByTimePeriod<T extends { scheduledTime: string }>(schedules: T[]): TimePeriodGroup<T>[] {
    const periods: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
    const groups: TimePeriodGroup<T>[] = periods.map((period) => ({
      period,
      label: ScheduleEntity.getTimePeriodLabel(period),
      schedules: [],
    }));

    for (const schedule of schedules) {
      const period = ScheduleEntity.getTimePeriod(schedule.scheduledTime);
      const group = groups.find((g) => g.period === period);
      if (group) group.schedules.push(schedule);
    }

    return groups;
  }

  /**
   * 完了率を算出(0-100%)
   */
  static calculateCompletionRate(completed: number, total: number): number {
    return MathHelper.calculatePercentage(completed, total);
  }

  /**
   * 完了率に応じたメッセージを返す
   */
  static getCompletionMessage(rate: number): string {
    if (rate >= 100) return '全ての予定が完了しました';
    if (rate >= 80) return 'あと少しで全て完了です';
    if (rate >= 50) return '順調に進んでいます';
    return '今日も頑張りましょう';
  }

  /**
   * ステータス配列からoverdueの件数を返す
   */
  static countOverdue(statuses: readonly string[]): number {
    return statuses.filter((s) => s === 'overdue').length;
  }

  /**
   * 飲み忘れ率を算出(0-100%)
   */
  static getOverdueRate(overdueCount: number, total: number): number {
    return MathHelper.calculatePercentage(overdueCount, total);
  }

  /**
   * 飲み忘れ率に応じたアラートレベルを返す
   */
  static getOverdueAlertLevel(rate: number): 'good' | 'caution' | 'alert' {
    if (rate >= 60) return 'alert';
    if (rate >= 30) return 'caution';
    return 'good';
  }

  /**
   * 2つの時刻文字列(HH:mm)間の差を分で返す(絶対値)
   */
  static getTimeDiffMinutes(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    return Math.abs(h1 * 60 + m1 - (h2 * 60 + m2));
  }

  /**
   * 2つの時刻が指定分数以内に近接しているか判定
   */
  static isTimeClose(time1: string, time2: string, thresholdMinutes: number = 30): boolean {
    return ScheduleEntity.getTimeDiffMinutes(time1, time2) <= thresholdMinutes;
  }

  /**
   * 時間差(分)に応じた近接レベルを返す
   */
  static getTimeProximityLevel(diffMinutes: number): 'warning' | 'info' | 'none' {
    if (diffMinutes <= 15) return 'warning';
    if (diffMinutes <= 30) return 'info';
    return 'none';
  }

  /**
   * ステータス配列から日別完了サマリーを算出
   */
  static getDailyCompletionSummary(statuses: ScheduleStatus[]): {
    completed: number;
    pending: number;
    overdue: number;
    total: number;
    rate: number;
  } {
    const total = statuses.length;
    const completed = statuses.filter((s) => s === 'completed').length;
    const overdue = ScheduleEntity.countOverdue(statuses);
    const pending = total - completed - overdue;
    return {
      completed,
      pending,
      overdue,
      total,
      rate: MathHelper.calculatePercentage(completed, total),
    };
  }

  /**
   * 完了数と合計数に応じた進捗メッセージを返す
   */
  static getProgressMessage(completed: number, total: number): string {
    if (total === 0) return '予定がありません';
    if (completed === total) return '全ての予定を達成しました';
    if (completed >= total / 2) return 'もう少しで全て完了です';
    return '少しずつ進めていきましょう';
  }

  get id(): string {
    return this.schedule.id;
  }

  get data(): Schedule {
    return this.schedule;
  }

  /**
   * 同じ時間・同じ曜日の重複スケジュールを検知する
   */
  static findOverlappingSchedules(
    schedules: { id: string; time: string; daysOfWeek: string[]; medicationName: string }[],
  ): { scheduleIds: string[]; time: string; day: string }[] {
    const overlaps: { scheduleIds: string[]; time: string; day: string }[] = [];
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const a = schedules[i];
        const b = schedules[j];
        if (a.time !== b.time) continue;
        const aDays = a.daysOfWeek.length === 0 ? ['every'] : a.daysOfWeek;
        const bDays = b.daysOfWeek.length === 0 ? ['every'] : b.daysOfWeek;
        const commonDays = aDays.filter((d) => bDays.includes(d) || d === 'every' || bDays.includes('every'));
        if (commonDays.length > 0) {
          overlaps.push({ scheduleIds: [a.id, b.id], time: a.time, day: commonDays[0] });
        }
      }
    }
    return overlaps;
  }

  /**
   * 2つの時間が近すぎないかチェック（デフォルト15分以内）
   */
  static hasTimeConflict(time1: string, time2: string, thresholdMinutes: number = 15): boolean {
    return ScheduleEntity.getTimeDiffMinutes(time1, time2) <= thresholdMinutes;
  }

  /**
   * 重複検知時のメッセージを生成
   */
  static getConflictMessage(medicationNameA: string, medicationNameB: string, time: string): string {
    return `${medicationNameA}と${medicationNameB}が${time}に重複しています`;
  }

  private static readonly DAY_INDEX: Record<DayOfWeek, number> = {
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };

  /**
   * 曜日別の完了率を算出する
   * 返り値: [日, 月, 火, 水, 木, 金, 土] の完了率(0-100)
   */
  static getDayCompletionRates(completed: DayOfWeek[], scheduled: DayOfWeek[]): number[] {
    const completedCounts = new Array(7).fill(0);
    const scheduledCounts = new Array(7).fill(0);
    for (const day of completed) {
      completedCounts[ScheduleEntity.DAY_INDEX[day]]++;
    }
    for (const day of scheduled) {
      scheduledCounts[ScheduleEntity.DAY_INDEX[day]]++;
    }
    return scheduledCounts.map((total, i) =>
      total === 0 ? 0 : MathHelper.calculatePercentage(completedCounts[i], total),
    );
  }

  /**
   * 最も完了率が低い曜日インデックスを返す（0%の曜日は除外）
   */
  static getWeakestDay(rates: number[]): number | null {
    const nonZero = rates.map((r, i) => ({ rate: r, index: i })).filter((r) => r.rate > 0);
    if (nonZero.length === 0) return null;
    return nonZero.reduce((min, r) => (r.rate < min.rate ? r : min)).index;
  }

  /**
   * 最も完了率が高い曜日インデックスを返す
   */
  static getStrongestDay(rates: number[]): number | null {
    const max = Math.max(...rates);
    if (max === 0) return null;
    return rates.indexOf(max);
  }
}
