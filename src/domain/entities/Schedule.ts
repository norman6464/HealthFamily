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
  private static readonly TIME_PERIOD_MORNING_START = 5;
  private static readonly TIME_PERIOD_AFTERNOON_START = 12;
  private static readonly TIME_PERIOD_EVENING_START = 17;
  private static readonly TIME_PERIOD_NIGHT_START = 21;
  private static readonly PROXIMITY_IMMINENT_MINUTES = 15;
  private static readonly PROXIMITY_SOON_MINUTES = 30;
  private static readonly PROXIMITY_NEAR_MINUTES = 60;

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

    const dayOfWeek = ScheduleEntity.DAY_MAP[date.getDay()];
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
    if (diffMinutes >= ScheduleEntity.PROXIMITY_NEAR_MINUTES) return 'danger';
    if (diffMinutes >= ScheduleEntity.PROXIMITY_SOON_MINUTES) return 'warning';
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
    if (hour >= ScheduleEntity.TIME_PERIOD_MORNING_START && hour < ScheduleEntity.TIME_PERIOD_AFTERNOON_START) return 'morning';
    if (hour >= ScheduleEntity.TIME_PERIOD_AFTERNOON_START && hour < ScheduleEntity.TIME_PERIOD_EVENING_START) return 'afternoon';
    if (hour >= ScheduleEntity.TIME_PERIOD_EVENING_START && hour < ScheduleEntity.TIME_PERIOD_NIGHT_START) return 'evening';
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
    if (diffMinutes <= ScheduleEntity.PROXIMITY_IMMINENT_MINUTES) return 'warning';
    if (diffMinutes <= ScheduleEntity.PROXIMITY_SOON_MINUTES) return 'info';
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
    const rate = ScheduleEntity.calculateCompletionRate(completed, total);
    if (rate >= 100) return '全ての予定を達成しました';
    if (rate >= 50) return 'もう少しで全て完了です';
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

  /**
   * 曜日別の完了率を算出する
   * 返り値: [日, 月, 火, 水, 木, 金, 土] の完了率(0-100)
   */
  static getDayCompletionRates(completed: DayOfWeek[], scheduled: DayOfWeek[]): number[] {
    const completedCounts = new Array(7).fill(0);
    const scheduledCounts = new Array(7).fill(0);
    for (const day of completed) {
      completedCounts[ScheduleEntity.VALID_DAYS.indexOf(day)]++;
    }
    for (const day of scheduled) {
      scheduledCounts[ScheduleEntity.VALID_DAYS.indexOf(day)]++;
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

  /**
   * 開始時刻と分数から時間範囲の文字列を生成する
   */
  static formatTimeRange(startTime: string, durationMinutes: number): string {
    if (durationMinutes === 0) return startTime;
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + durationMinutes;
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
    return `${startTime} - ${endTime}`;
  }

  /**
   * 予定までの残り時間を日本語で表示する
   */
  static getTimeUntilLabel(minutes: number): string {
    if (minutes < 0) return '予定時刻を過ぎています';
    if (minutes === 0) return 'まもなく';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}分後`;
    if (m === 0) return `${h}時間後`;
    return `${h}時間${m}分後`;
  }

  private static readonly DAY_LABELS: Record<DayOfWeek, string> = {
    sun: '日', mon: '月', tue: '火', wed: '水', thu: '木', fri: '金', sat: '土',
  };

  /**
   * 曜日コード配列を日本語ラベルに変換する
   */
  static getDaysOfWeekLabels(days: DayOfWeek[]): string[] {
    return days.map((d) => ScheduleEntity.DAY_LABELS[d]);
  }

  /**
   * 重複件数に応じたサマリーメッセージを返す
   */
  static getOverlapSummary(overlapCount: number): string {
    if (overlapCount === 0) return '重複するスケジュールはありません';
    return `${overlapCount}件の重複があります`;
  }

  /**
   * 個別の重複情報をテキスト化する
   */
  static formatOverlapDetail(time: string, day: string): string {
    const dayLabel = day === 'every' ? '毎日' : (ScheduleEntity.DAY_LABELS[day as DayOfWeek] || day);
    return `${dayLabel} ${time}に重複`;
  }

  /**
   * 重複が1件以上あるかを判定する
   */
  static hasAnyOverlap(overlaps: { scheduleIds: string[]; time: string; day: string }[]): boolean {
    return overlaps.length > 0;
  }

  private static readonly VALID_DAYS: readonly DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  /**
   * 曜日配列のバリデーション
   */
  static validateDaysOfWeek(days: string[]): { valid: boolean; error?: string } {
    for (const day of days) {
      if (!ScheduleEntity.VALID_DAYS.includes(day as DayOfWeek)) {
        return { valid: false, error: `無効な曜日が含まれています: ${day}` };
      }
    }
    return { valid: true };
  }

  /**
   * 曜日配列の正規化（重複除去・曜日順ソート）
   */
  static normalizeDaysOfWeek(days: DayOfWeek[]): DayOfWeek[] {
    const unique = [...new Set(days)];
    return unique.sort((a, b) =>
      ScheduleEntity.VALID_DAYS.indexOf(a) - ScheduleEntity.VALID_DAYS.indexOf(b),
    );
  }

  /**
   * 曜日配列をサマリーテキストにフォーマットする
   */
  private static readonly DAY_MAP: Record<number, DayOfWeek> = {
    0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat',
  };

  /**
   * 次に有効な曜日を返す（今日の翌日から探索）
   */
  static getNextScheduledDay(today: Date, daysOfWeek: DayOfWeek[]): DayOfWeek {
    for (let offset = 1; offset <= 7; offset++) {
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + offset);
      const dayCode = ScheduleEntity.DAY_MAP[nextDate.getDay()];
      if (daysOfWeek.length === 0 || daysOfWeek.includes(dayCode)) {
        return dayCode;
      }
    }
    return ScheduleEntity.DAY_MAP[((today.getDay() + 1) % 7)];
  }

  /**
   * 次回のスケジュール日時を算出する
   */
  static getNextScheduledDateTime(today: Date, time: string, daysOfWeek: DayOfWeek[]): Date {
    const [hours, minutes] = time.split(':').map(Number);
    for (let offset = 1; offset <= 7; offset++) {
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + offset);
      const dayCode = ScheduleEntity.DAY_MAP[nextDate.getDay()];
      if (daysOfWeek.length === 0 || daysOfWeek.includes(dayCode)) {
        nextDate.setHours(hours, minutes, 0, 0);
        return nextDate;
      }
    }
    const fallback = new Date(today);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(hours, minutes, 0, 0);
    return fallback;
  }

  /**
   * 次回スケジュールまでの日数を返す
   */
  static getDaysUntilNextSchedule(today: Date, daysOfWeek: DayOfWeek[]): number {
    for (let offset = 1; offset <= 7; offset++) {
      const nextDate = new Date(today);
      nextDate.setDate(nextDate.getDate() + offset);
      const dayCode = ScheduleEntity.DAY_MAP[nextDate.getDay()];
      if (daysOfWeek.length === 0 || daysOfWeek.includes(dayCode)) {
        return offset;
      }
    }
    return 1;
  }

  static formatDaysOfWeekSummary(days: DayOfWeek[]): string {
    if (days.length === 0 || days.length === 7) return '毎日';

    const sorted = ScheduleEntity.normalizeDaysOfWeek(days);
    const weekdays: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
    const weekend: DayOfWeek[] = ['sat', 'sun'];

    if (sorted.length === 5 && weekdays.every((d) => sorted.includes(d))) return '平日';
    if (sorted.length === 2 && weekend.every((d) => sorted.includes(d))) return '週末';

    return sorted.map((d) => ScheduleEntity.DAY_LABELS[d]).join(', ');
  }

  /**
   * 1日のスケジュール数から密度レベルを返す
   */
  static getScheduleDensity(count: number): 'none' | 'low' | 'medium' | 'high' {
    if (count === 0) return 'none';
    if (count <= 3) return 'low';
    if (count <= 6) return 'medium';
    return 'high';
  }

  /**
   * HH:mm形式の時刻を分数に変換する
   */
  private static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * 2つの時刻が指定分数以内に近いか判定する
   */
  static hasTimeOverlap(time1: string, time2: string, thresholdMinutes: number): boolean {
    const diff = Math.abs(ScheduleEntity.timeToMinutes(time1) - ScheduleEntity.timeToMinutes(time2));
    return diff <= thresholdMinutes;
  }

  /**
   * 既存時刻から最も離れた時刻帯を提案する(08:00-20:00の範囲)
   */
  static getOptimalTimeSuggestion(existingTimes: string[]): string {
    if (existingTimes.length === 0) return '08:00';

    const existing = existingTimes.map((t) => ScheduleEntity.timeToMinutes(t)).sort((a, b) => a - b);
    const candidates = [480, 720, 840, 960, 1080, 1200]; // 08,12,14,16,18,20

    let bestTime = candidates[0];
    let maxMinDist = -1;

    for (const candidate of candidates) {
      const minDist = Math.min(...existing.map((e) => Math.abs(candidate - e)));
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        bestTime = candidate;
      }
    }

    const h = Math.floor(bestTime / 60).toString().padStart(2, '0');
    const m = (bestTime % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * 週あたりのスケジュール回数を算出する
   */
  static getWeeklyScheduleCount(schedules: { daysOfWeek: string[] }[]): number {
    let count = 0;
    for (const s of schedules) {
      count += s.daysOfWeek.length === 0 ? 7 : s.daysOfWeek.length;
    }
    return count;
  }

  /**
   * 薬別のスケジュール件数サマリーを件数降順で返す
   */
  static getMedicationScheduleSummary(
    schedules: { medicationId: string; medicationName: string }[],
  ): Array<{ medicationId: string; name: string; count: number }> {
    const map = new Map<string, { name: string; count: number }>();
    for (const s of schedules) {
      const existing = map.get(s.medicationId);
      if (existing) {
        existing.count++;
      } else {
        map.set(s.medicationId, { name: s.medicationName, count: 1 });
      }
    }
    return Array.from(map.entries())
      .map(([medicationId, v]) => ({ medicationId, name: v.name, count: v.count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * スケジュール件数に応じた負荷ラベルを返す
   */
  static getScheduleLoadLabel(count: number): string {
    if (count === 0) return 'なし';
    if (count <= 5) return '軽い';
    if (count <= 10) return '普通';
    if (count < 20) return '多い';
    return '非常に多い';
  }

  /**
   * スケジュール状態と残り時間から通知優先度を算出する(0-10)
   */
  static getNotificationPriority(status: ScheduleStatus, minutesUntil: number): number {
    if (status === 'completed') return 0;
    if (status === 'overdue') return 10;
    if (minutesUntil <= ScheduleEntity.PROXIMITY_IMMINENT_MINUTES) return 8;
    if (minutesUntil <= ScheduleEntity.PROXIMITY_SOON_MINUTES) return 6;
    if (minutesUntil <= ScheduleEntity.PROXIMITY_NEAR_MINUTES) return 4;
    return 2;
  }

  /**
   * 通知優先度に応じたラベルを返す
   */
  static getNotificationPriorityLabel(priority: number): string {
    if (priority >= 10) return '緊急';
    if (priority >= 7) return '高';
    if (priority >= 4) return '中';
    if (priority >= 1) return '低';
    return 'なし';
  }

  /**
   * 通知優先度の高い順にソートする
   */
  static sortByNotificationPriority<T extends { status: ScheduleStatus; minutesUntil: number }>(
    items: T[],
  ): T[] {
    return [...items].sort((a, b) => {
      const priorityA = ScheduleEntity.getNotificationPriority(a.status, a.minutesUntil);
      const priorityB = ScheduleEntity.getNotificationPriority(b.status, b.minutesUntil);
      return priorityB - priorityA;
    });
  }

  /**
   * 時間帯別のスケジュール分布を集計する
   */
  static getTimePeriodDistribution(times: string[]): Record<TimePeriod, number> {
    const dist: Record<TimePeriod, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    for (const time of times) {
      const hour = parseInt(time.split(':')[0], 10);
      const period = ScheduleEntity.getTimePeriodForHour(hour);
      dist[period]++;
    }
    return dist;
  }

  private static getTimePeriodForHour(hour: number): TimePeriod {
    if (hour >= ScheduleEntity.TIME_PERIOD_NIGHT_START) return 'night';
    if (hour >= ScheduleEntity.TIME_PERIOD_EVENING_START) return 'evening';
    if (hour >= ScheduleEntity.TIME_PERIOD_AFTERNOON_START) return 'afternoon';
    if (hour >= ScheduleEntity.TIME_PERIOD_MORNING_START) return 'morning';
    return 'night';
  }

  private static readonly TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
    morning: '朝',
    afternoon: '午後',
    evening: '夕方',
    night: '夜',
  };

  /**
   * 時間帯分布の偏りラベルを返す
   */
  /**
   * 完了履歴から規則性スコア(0-100)を算出する
   */
  static getScheduleRegularityScore(completionHistory: boolean[]): number {
    if (completionHistory.length === 0) return 0;
    const completed = completionHistory.filter(Boolean).length;
    return Math.round((completed / completionHistory.length) * 100);
  }

  /**
   * 規則性スコアに応じたラベルを返す
   */
  static getRegularityLabel(score: number): string {
    if (score >= 100) return '完璧';
    if (score >= 80) return '優秀';
    if (score >= 60) return '良好';
    if (score >= 40) return '要改善';
    return '不十分';
  }

  static getTimePeriodDistributionLabel(dist: Record<TimePeriod, number>): string {
    const total = dist.morning + dist.afternoon + dist.evening + dist.night;
    if (total === 0) return '均等';
    const periods: TimePeriod[] = ['morning', 'afternoon', 'evening', 'night'];
    const max = Math.max(...periods.map((p) => dist[p]));
    if (max > total * 0.6) {
      const dominant = periods.find((p) => dist[p] === max);
      return `${ScheduleEntity.TIME_PERIOD_LABELS[dominant!]}に集中`;
    }
    return '均等';
  }

  /**
   * スケジュール時刻の均等性スコア(0-100)を算出する
   */
  static getScheduleSpacingScore(times: string[]): number {
    if (times.length === 0) return 0;
    if (times.length === 1) return 100;
    const minutes = times.map((t) => ScheduleEntity.timeToMinutes(t)).sort((a, b) => a - b);
    const intervals: number[] = [];
    for (let i = 1; i < minutes.length; i++) {
      intervals.push(minutes[i] - minutes[i - 1]);
    }
    const idealInterval = (minutes[minutes.length - 1] - minutes[0]) / (minutes.length - 1);
    if (idealInterval === 0) return 100;
    const deviations = intervals.map((iv) => Math.abs(iv - idealInterval));
    const avgDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
    const score = Math.max(0, Math.round(100 - (avgDeviation / idealInterval) * 100));
    return score;
  }

  /**
   * 均等性スコアに応じたラベルを返す
   */
  static getSpacingLabel(score: number): string {
    if (score >= 80) return '均等';
    if (score >= 50) return 'やや偏り';
    return '偏りあり';
  }

  /**
   * 完了履歴から末尾の連続完了日数を算出する
   */
  static getScheduleCompletionStreak(completionHistory: boolean[]): number {
    let streak = 0;
    for (let i = completionHistory.length - 1; i >= 0; i--) {
      if (completionHistory[i]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /**
   * 連続完了日数に応じたラベルを返す
   */
  static getCompletionStreakLabel(days: number): string {
    if (days === 0) return '記録なし';
    if (days >= 30) return '1ヶ月連続';
    if (days >= 7 && days % 7 === 0) return `${days / 7}週間連続`;
    return `${days}日連続`;
  }
}
