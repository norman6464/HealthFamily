/**
 * カレンダーユーティリティ
 */

import { DAY_LABELS_JP } from '../../lib/constants';
import { DateRangeHelper } from './DateRange';

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
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
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
    return [...DAY_LABELS_JP];
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
   * 日付をYYYY-MM-DD形式に変換
   */
  static formatDateKey(date: Date): string {
    return DateRangeHelper.toDateKey(date);
  }
}
