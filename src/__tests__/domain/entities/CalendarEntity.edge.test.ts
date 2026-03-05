import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity エッジケーステスト', () => {
  describe('getConditionColor 境界値', () => {
    it('レベル5は緑を返す', () => {
      expect(CalendarEntity.getConditionColor(5)).toBe('bg-green-100');
    });

    it('レベル4はちょうど緑の境界', () => {
      expect(CalendarEntity.getConditionColor(4)).toBe('bg-green-100');
    });

    it('レベル3.9は黄色を返す', () => {
      expect(CalendarEntity.getConditionColor(3.9)).toBe('bg-yellow-100');
    });

    it('レベル3はちょうど黄色の境界', () => {
      expect(CalendarEntity.getConditionColor(3)).toBe('bg-yellow-100');
    });

    it('レベル2.9はオレンジを返す', () => {
      expect(CalendarEntity.getConditionColor(2.9)).toBe('bg-orange-100');
    });

    it('レベル2はちょうどオレンジの境界', () => {
      expect(CalendarEntity.getConditionColor(2)).toBe('bg-orange-100');
    });

    it('レベル1.9は赤を返す', () => {
      expect(CalendarEntity.getConditionColor(1.9)).toBe('bg-red-100');
    });

    it('レベル0は赤を返す', () => {
      expect(CalendarEntity.getConditionColor(0)).toBe('bg-red-100');
    });
  });

  describe('generateMonth 月初が日曜日の場合', () => {
    it('前月の日が含まれない', () => {
      // 2026年2月1日は日曜日
      const days = CalendarEntity.generateMonth(2026, 1);
      const firstDay = days[0];
      expect(firstDay.date.getMonth()).toBe(1);
      expect(firstDay.date.getDate()).toBe(1);
      expect(firstDay.isCurrentMonth).toBe(true);
    });
  });

  describe('generateMonth 月初が土曜日の場合', () => {
    it('前月の日が6日分含まれる', () => {
      // 2026年8月1日は土曜日
      const days = CalendarEntity.generateMonth(2026, 7);
      const prevMonthDays = days.filter((d) => !d.isCurrentMonth && d.date.getMonth() === 6);
      expect(prevMonthDays).toHaveLength(6);
    });
  });

  describe('getMonthLabel 境界値', () => {
    it('0月は1月と表示', () => {
      expect(CalendarEntity.getMonthLabel(2026, 0)).toBe('2026年1月');
    });

    it('11月は12月と表示', () => {
      expect(CalendarEntity.getMonthLabel(2026, 11)).toBe('2026年12月');
    });
  });

  describe('getWeekdayHeaders', () => {
    it('元の配列を変更しても影響しない', () => {
      const headers1 = CalendarEntity.getWeekdayHeaders();
      headers1[0] = '変更';
      const headers2 = CalendarEntity.getWeekdayHeaders();
      expect(headers2[0]).toBe('日');
    });
  });

  describe('formatDateKey 月末境界', () => {
    it('2月28日(非閏年)', () => {
      expect(CalendarEntity.formatDateKey(new Date(2025, 1, 28))).toBe('2025-02-28');
    });

    it('2月29日(閏年)', () => {
      expect(CalendarEntity.formatDateKey(new Date(2024, 1, 29))).toBe('2024-02-29');
    });

    it('9月30日(30日月の末日)', () => {
      expect(CalendarEntity.formatDateKey(new Date(2026, 8, 30))).toBe('2026-09-30');
    });
  });
});
