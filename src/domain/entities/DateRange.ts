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
}
