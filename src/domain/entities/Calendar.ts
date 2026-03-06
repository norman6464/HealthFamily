/**
 * カレンダーユーティリティ
 */

import { DateRangeHelper } from './DateRange';
import { MathHelper } from './MathHelper';

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  recordCount: number;
  averageCondition: number | null;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export class CalendarEntity {
  /**
   * 指定月のカレンダーデータを生成
   * 前月末・翌月初の日も含めて6週分を生成
   */
  static generateMonth(year: number, month: number, today: Date = new Date()): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 日曜始まりのカレンダー
    const startOffset = firstDay.getDay();
    const days: CalendarDay[] = [];

    // 前月の日を追加
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: CalendarEntity.isSameDay(date, today),
        recordCount: 0,
        averageCondition: null,
      });
    }

    // 当月の日を追加
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: CalendarEntity.isSameDay(date, today),
        recordCount: 0,
        averageCondition: null,
      });
    }

    // 翌月の日を追加（6週分に揃える）
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: CalendarEntity.isSameDay(date, today),
        recordCount: 0,
        averageCondition: null,
      });
    }

    return days;
  }

  /**
   * 同じ日かどうかを判定
   */
  static isSameDay(a: Date, b: Date): boolean {
    return DateRangeHelper.toDateKey(a) === DateRangeHelper.toDateKey(b);
  }

  /**
   * 月名を日本語で取得
   */
  static getMonthLabel(year: number, month: number): string {
    return `${year}年${month + 1}月`;
  }

  /**
   * 曜日ヘッダーを取得
   */
  static getWeekdayHeaders(): string[] {
    return DateRangeHelper.getDayLabels();
  }

  /**
   * 前月のyear, monthを取得
   */
  static getPreviousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 0) return { year: year - 1, month: 11 };
    return { year, month: month - 1 };
  }

  /**
   * 翌月のyear, monthを取得
   */
  static getNextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 11) return { year: year + 1, month: 0 };
    return { year, month: month + 1 };
  }

  /**
   * 服薬件数に応じた背景色クラスを取得
   */
  static getRecordCountColor(count: number): string {
    if (count === 0) return '';
    if (count <= 2) return 'bg-green-100';
    if (count <= 5) return 'bg-green-200';
    return 'bg-green-300';
  }

  /**
   * 体調レベルに応じた背景色クラスを取得
   */
  static getConditionColor(level: number | null): string {
    if (level === null) return '';
    if (level >= 4) return 'bg-green-100';
    if (level >= 3) return 'bg-yellow-100';
    if (level >= 2) return 'bg-orange-100';
    return 'bg-red-100';
  }

  /**
   * 週間サマリーを算出
   */
  static getWeekSummary(days: CalendarDay[]): {
    totalRecords: number;
    averageCondition: number | null;
    daysWithRecords: number;
  } {
    const totalRecords = days.reduce((sum, d) => sum + d.recordCount, 0);
    const daysWithCondition = days.filter((d) => d.averageCondition !== null);
    const daysWithRecords = days.filter((d) => d.recordCount > 0).length;
    const averageCondition =
      daysWithCondition.length > 0
        ? Math.round(
            daysWithCondition.reduce((sum, d) => sum + (d.averageCondition as number), 0) /
              daysWithCondition.length,
          )
        : null;
    return { totalRecords, averageCondition, daysWithRecords };
  }

  /**
   * 週の完了状態を判定
   */
  static getWeekCompletionStatus(days: CalendarDay[]): 'complete' | 'partial' | 'empty' {
    if (days.length === 0) return 'empty';
    const hasRecord = days.filter((d) => d.recordCount > 0).length;
    if (hasRecord === 0) return 'empty';
    if (hasRecord === days.length) return 'complete';
    return 'partial';
  }

  /**
   * 最も記録が多い日を返す
   */
  static getBusiestDay(days: CalendarDay[]): CalendarDay | null {
    if (days.length === 0) return null;
    const max = days.reduce((best, d) => (d.recordCount > best.recordCount ? d : best), days[0]);
    return max.recordCount > 0 ? max : null;
  }

  /**
   * 日付をYYYY-MM-DD形式に変換
   */
  static formatDateKey(date: Date): string {
    return DateRangeHelper.toDateKey(date);
  }

  /**
   * 月間の記録日数率(0-100)を返す（当月の日のみ対象）
   */
  static getMonthlyRecordRate(days: CalendarDay[]): number {
    const currentMonthDays = days.filter((d) => d.isCurrentMonth);
    if (currentMonthDays.length === 0) return 0;
    const daysWithRecords = currentMonthDays.filter((d) => d.recordCount > 0).length;
    return MathHelper.calculatePercentage(daysWithRecords, currentMonthDays.length);
  }

  /**
   * 記録がある週の数を返す
   */
  static getActiveWeeks(days: CalendarDay[]): number {
    const weeks = new Set<number>();
    for (const day of days) {
      if (day.recordCount > 0) {
        weeks.add(DateRangeHelper.getWeekNumber(day.date));
      }
    }
    return weeks.size;
  }

  /**
   * カレンダーデータを週単位に分割する
   */
  static getWeeksInMonth(days: CalendarDay[]): CalendarDay[][] {
    if (days.length === 0) return [];
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }

  /**
   * 週の日付範囲ラベルを生成する
   */
  static getWeekLabel(days: CalendarDay[]): string {
    if (days.length === 0) return '';
    const first = days[0].date;
    if (days.length === 1) return `${first.getMonth() + 1}/${first.getDate()}`;
    const last = days[days.length - 1].date;
    return `${first.getMonth() + 1}/${first.getDate()} - ${last.getMonth() + 1}/${last.getDate()}`;
  }

  /**
   * 週ごとの合計記録数を返す
   */
  static getMonthlyTrend(days: CalendarDay[]): number[] {
    const weeks = CalendarEntity.getWeeksInMonth(days);
    return weeks.map((week) => week.reduce((sum, d) => sum + d.recordCount, 0));
  }
}
