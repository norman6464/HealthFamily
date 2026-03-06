import { describe, it, expect } from 'vitest';
import { CalendarEntity, CalendarDay } from '@/domain/entities/Calendar';

const createDay = (date: Date, recordCount: number = 0): CalendarDay => ({
  date,
  isCurrentMonth: true,
  isToday: false,
  recordCount,
  averageCondition: null,
});

describe('CalendarEntity 週単位分析', () => {
  describe('getWeeksInMonth', () => {
    it('42日を6週に分割する', () => {
      const days = Array.from({ length: 42 }, (_, i) =>
        createDay(new Date(2026, 2, i + 1)),
      );
      const weeks = CalendarEntity.getWeeksInMonth(days);
      expect(weeks).toHaveLength(6);
      expect(weeks[0]).toHaveLength(7);
    });

    it('空配列は空配列を返す', () => {
      expect(CalendarEntity.getWeeksInMonth([])).toEqual([]);
    });

    it('7日未満は1週として返す', () => {
      const days = [createDay(new Date(2026, 2, 1))];
      const weeks = CalendarEntity.getWeeksInMonth(days);
      expect(weeks).toHaveLength(1);
      expect(weeks[0]).toHaveLength(1);
    });
  });

  describe('getWeekLabel', () => {
    it('週の開始日と終了日のラベルを返す', () => {
      const days = Array.from({ length: 7 }, (_, i) =>
        createDay(new Date(2026, 2, i + 1)),
      );
      const label = CalendarEntity.getWeekLabel(days);
      expect(label).toBe('3/1 - 3/7');
    });

    it('空配列は空文字を返す', () => {
      expect(CalendarEntity.getWeekLabel([])).toBe('');
    });

    it('1日のみの場合は単一日のラベルを返す', () => {
      const days = [createDay(new Date(2026, 2, 15))];
      expect(CalendarEntity.getWeekLabel(days)).toBe('3/15');
    });
  });

  describe('getMonthlyTrend', () => {
    it('空配列は空配列を返す', () => {
      expect(CalendarEntity.getMonthlyTrend([])).toEqual([]);
    });

    it('週ごとの合計記録数を返す', () => {
      const days = Array.from({ length: 14 }, (_, i) =>
        createDay(new Date(2026, 2, i + 1), i < 7 ? 2 : 1),
      );
      const trend = CalendarEntity.getMonthlyTrend(days);
      expect(trend).toHaveLength(2);
      expect(trend[0]).toBe(14); // 7 * 2
      expect(trend[1]).toBe(7); // 7 * 1
    });

    it('記録がない週は0を返す', () => {
      const days = Array.from({ length: 7 }, (_, i) =>
        createDay(new Date(2026, 2, i + 1), 0),
      );
      const trend = CalendarEntity.getMonthlyTrend(days);
      expect(trend[0]).toBe(0);
    });
  });
});
