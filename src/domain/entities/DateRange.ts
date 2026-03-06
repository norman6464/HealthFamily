/**
 * 日付範囲計算ヘルパー
 */

const DAY_TO_INDEX: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export class DateRangeHelper {
  /**
   * 日付をYYYY-MM-DD形式のキーに変換
   */
  static toDateKey(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 日付を0時0分0秒に正規化したコピーを返す
   */
  static toStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 指定日数前の日付を0時0分0秒で返す
   */
  static daysAgo(days: number, from: Date = new Date()): Date {
    const date = DateRangeHelper.toStartOfDay(from);
    date.setDate(date.getDate() - days);
    return date;
  }

  /**
   * スケジュールの曜日配列から曜日別の期待数を算出
   * 返り値: [日, 月, 火, 水, 木, 金, 土] の順で期待数
   */
  static calculateExpectedByDayOfWeek(schedules: { daysOfWeek: string[] }[]): number[] {
    const expected = new Array(7).fill(0);
    for (const schedule of schedules) {
      if (schedule.daysOfWeek.length === 0) {
        for (let i = 0; i < 7; i++) expected[i] += 1;
      } else {
        for (const day of schedule.daysOfWeek) {
          const index = DAY_TO_INDEX[day];
          if (index !== undefined) expected[index] += 1;
        }
      }
    }
    return expected;
  }

  /**
   * 日数から期間ラベルを生成
   */
  static getPeriodLabel(days: number): string {
    return `過去${days}日間`;
  }

  /**
   * 2つの日付間の日数差を計算（to - from）
   */
  static diffDays(from: Date, to: Date): number {
    const fromStart = DateRangeHelper.toStartOfDay(from);
    const toStart = DateRangeHelper.toStartOfDay(to);
    return Math.round((toStart.getTime() - fromStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 日付が基準日からdays日以内かどうかを判定
   */
  static isWithinDays(date: Date, reference: Date, days: number): boolean {
    return Math.abs(DateRangeHelper.diffDays(reference, date)) <= days;
  }

  /**
   * 2つの日付間の全日付キー（YYYY-MM-DD）を配列で返す
   */
  static getDatesBetween(from: Date, to: Date): string[] {
    const result: string[] = [];
    const current = DateRangeHelper.toStartOfDay(from);
    const end = DateRangeHelper.toStartOfDay(to);
    while (current <= end) {
      result.push(DateRangeHelper.toDateKey(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  /**
   * 曜日の日本語ラベルを返す
   */
  private static readonly DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

  static getDayOfWeekLabel(date: Date): string {
    return DateRangeHelper.DAY_LABELS[date.getDay()];
  }

  /**
   * 曜日ラベル配列を返す（日〜土）
   */
  static getDayLabels(): string[] {
    return [...DateRangeHelper.DAY_LABELS];
  }

  /**
   * 土日かどうかを判定
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  /**
   * 年内の週番号を返す（1始まり）
   */
  static getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.ceil((days + 1) / 7);
  }

  /**
   * 開始日が終了日以前であることを検証する
   */
  static isValidDateRange(from: Date, to: Date): boolean {
    return from.getTime() <= to.getTime();
  }

  /**
   * 日付を指定範囲内に制約する
   */
  static clampDate(date: Date, min: Date, max: Date): Date {
    if (date.getTime() < min.getTime()) return min;
    if (date.getTime() > max.getTime()) return max;
    return date;
  }

  /**
   * 指定月の開始日と終了日を返す（monthは0-indexed）
   */
  static getMonthRange(year: number, month: number): { start: Date; end: Date } {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  }
}
