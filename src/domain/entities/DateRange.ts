/**
 * 日付範囲計算ヘルパー
 */

const DAY_TO_INDEX: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

export class DateRangeHelper {
  /**
   * 指定日数前の日付を0時0分0秒で返す
   */
  static daysAgo(days: number, from: Date = new Date()): Date {
    const date = new Date(from);
    date.setDate(date.getDate() - days);
    date.setHours(0, 0, 0, 0);
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
}
