import { describe, it, expect } from 'vitest';
import { CalendarEntity, CalendarDay } from '@/domain/entities/Calendar';

const createDay = (date: Date, recordCount: number = 0): CalendarDay => ({
  date,
  isCurrentMonth: true,
  isToday: false,
  recordCount,
  averageCondition: null,
});

describe('CalendarWeekAnalysis エッジケース', () => {
  describe('getWeeksInMonth エッジケース', () => {
    it('14日は2週に分割される', () => {
      const days = Array.from({ length: 14 }, (_, i) =>
        createDay(new Date(2026, 2, i + 1)),
      );
      expect(CalendarEntity.getWeeksInMonth(days)).toHaveLength(2);
    });

    it('8日は2週に分割される（2週目は1日のみ）', () => {
      const days = Array.from({ length: 8 }, (_, i) =>
        createDay(new Date(2026, 2, i + 1)),
      );
      const weeks = CalendarEntity.getWeeksInMonth(days);
      expect(weeks).toHaveLength(2);
      expect(weeks[1]).toHaveLength(1);
    });
  });

  describe('getWeekLabel エッジケース', () => {
    it('月をまたぐ場合の表示', () => {
      const days = [
        createDay(new Date(2026, 2, 30)),
        createDay(new Date(2026, 2, 31)),
        createDay(new Date(2026, 3, 1)),
      ];
      expect(CalendarEntity.getWeekLabel(days)).toBe('3/30 - 4/1');
    });
  });

  describe('getMonthlyTrend エッジケース', () => {
    it('全週に記録がある場合の推移', () => {
      const days = Array.from({ length: 21 }, (_, i) =>
        createDay(new Date(2026, 2, i + 1), i % 7 === 0 ? 3 : 1),
      );
      const trend = CalendarEntity.getMonthlyTrend(days);
      expect(trend).toHaveLength(3);
      expect(trend[0]).toBe(9); // 3 + 1*6
    });
  });
});
