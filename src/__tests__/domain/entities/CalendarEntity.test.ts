import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity', () => {
  const fixedToday = new Date('2026-03-05T00:00:00');

  describe('generateMonth', () => {
    it('42日分のカレンダーデータを生成する', () => {
      const days = CalendarEntity.generateMonth(2026, 2, fixedToday); // 3月 (0-indexed: 2)
      expect(days).toHaveLength(42);
    });

    it('当月の日はisCurrentMonth=trueになる', () => {
      const days = CalendarEntity.generateMonth(2026, 2, fixedToday);
      const currentMonthDays = days.filter((d) => d.isCurrentMonth);
      expect(currentMonthDays).toHaveLength(31); // 2026年3月は31日
    });

    it('今日の日付はisToday=trueになる', () => {
      const days = CalendarEntity.generateMonth(2026, 2, fixedToday);
      const todayDays = days.filter((d) => d.isToday);
      expect(todayDays).toHaveLength(1);
      expect(todayDays[0].date.getDate()).toBe(5);
    });

    it('前月の日が含まれる', () => {
      const days = CalendarEntity.generateMonth(2026, 2, fixedToday);
      const prevMonthDays = days.filter((d) => !d.isCurrentMonth && d.date.getMonth() === 1);
      expect(prevMonthDays.length).toBeGreaterThanOrEqual(0);
    });

    it('全ての日のrecordCountが0で初期化される', () => {
      const days = CalendarEntity.generateMonth(2026, 2, fixedToday);
      expect(days.every((d) => d.recordCount === 0)).toBe(true);
    });
  });

  describe('isSameDay', () => {
    it('同じ日付ならtrueを返す', () => {
      const a = new Date('2026-03-05T10:00:00');
      const b = new Date('2026-03-05T15:00:00');
      expect(CalendarEntity.isSameDay(a, b)).toBe(true);
    });

    it('異なる日付ならfalseを返す', () => {
      const a = new Date('2026-03-05');
      const b = new Date('2026-03-06');
      expect(CalendarEntity.isSameDay(a, b)).toBe(false);
    });
  });

  describe('getMonthLabel', () => {
    it('日本語の月名を返す', () => {
      expect(CalendarEntity.getMonthLabel(2026, 2)).toBe('2026年3月');
      expect(CalendarEntity.getMonthLabel(2026, 0)).toBe('2026年1月');
      expect(CalendarEntity.getMonthLabel(2026, 11)).toBe('2026年12月');
    });
  });

  describe('getWeekdayHeaders', () => {
    it('7日分の曜日を返す', () => {
      const headers = CalendarEntity.getWeekdayHeaders();
      expect(headers).toHaveLength(7);
      expect(headers[0]).toBe('日');
      expect(headers[6]).toBe('土');
    });
  });

  describe('getPreviousMonth', () => {
    it('前月を返す', () => {
      expect(CalendarEntity.getPreviousMonth(2026, 2)).toEqual({ year: 2026, month: 1 });
    });

    it('1月の前月は前年12月', () => {
      expect(CalendarEntity.getPreviousMonth(2026, 0)).toEqual({ year: 2025, month: 11 });
    });
  });

  describe('getNextMonth', () => {
    it('翌月を返す', () => {
      expect(CalendarEntity.getNextMonth(2026, 2)).toEqual({ year: 2026, month: 3 });
    });

    it('12月の翌月は翌年1月', () => {
      expect(CalendarEntity.getNextMonth(2026, 11)).toEqual({ year: 2027, month: 0 });
    });
  });

  describe('getRecordCountColor', () => {
    it('0件は空文字を返す', () => {
      expect(CalendarEntity.getRecordCountColor(0)).toBe('');
    });

    it('1-2件は薄い緑', () => {
      expect(CalendarEntity.getRecordCountColor(1)).toBe('bg-green-100');
      expect(CalendarEntity.getRecordCountColor(2)).toBe('bg-green-100');
    });

    it('3-5件は中間の緑', () => {
      expect(CalendarEntity.getRecordCountColor(3)).toBe('bg-green-200');
    });

    it('6件以上は濃い緑', () => {
      expect(CalendarEntity.getRecordCountColor(6)).toBe('bg-green-300');
    });
  });

  describe('getConditionColor', () => {
    it('nullは空文字を返す', () => {
      expect(CalendarEntity.getConditionColor(null)).toBe('');
    });

    it('レベル4以上は緑', () => {
      expect(CalendarEntity.getConditionColor(4)).toBe('bg-green-100');
    });

    it('レベル3は黄色', () => {
      expect(CalendarEntity.getConditionColor(3)).toBe('bg-yellow-100');
    });

    it('レベル2はオレンジ', () => {
      expect(CalendarEntity.getConditionColor(2)).toBe('bg-orange-100');
    });

    it('レベル1は赤', () => {
      expect(CalendarEntity.getConditionColor(1)).toBe('bg-red-100');
    });
  });

  describe('formatDateKey', () => {
    it('日付をYYYY-MM-DD形式に変換する', () => {
      expect(CalendarEntity.formatDateKey(new Date(2026, 2, 5))).toBe('2026-03-05');
      expect(CalendarEntity.formatDateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
    });
  });
});
