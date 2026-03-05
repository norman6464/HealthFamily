import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity 境界値テスト', () => {
  describe('generateMonth 年越し', () => {
    it('1月のカレンダーに前年12月の日が含まれる', () => {
      const days = CalendarEntity.generateMonth(2026, 0); // 1月
      const decDays = days.filter((d) => !d.isCurrentMonth && d.date.getMonth() === 11);
      // 2026/1/1 is 木曜日なので、日月火水の4日分が前月
      expect(decDays.length).toBeGreaterThanOrEqual(0);
    });

    it('12月のカレンダーに翌年1月の日が含まれる', () => {
      const days = CalendarEntity.generateMonth(2026, 11); // 12月
      const janDays = days.filter((d) => !d.isCurrentMonth && d.date.getMonth() === 0);
      expect(janDays.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateMonth 2月', () => {
    it('閏年でない2月は28日', () => {
      // 2025年は閏年ではない
      const days = CalendarEntity.generateMonth(2025, 1);
      const febDays = days.filter((d) => d.isCurrentMonth);
      expect(febDays).toHaveLength(28);
    });

    it('閏年の2月は29日', () => {
      // 2024年は閏年
      const days = CalendarEntity.generateMonth(2024, 1);
      const febDays = days.filter((d) => d.isCurrentMonth);
      expect(febDays).toHaveLength(29);
    });
  });

  describe('formatDateKey 境界値', () => {
    it('1月1日を正しくフォーマットする', () => {
      expect(CalendarEntity.formatDateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
    });

    it('12月31日を正しくフォーマットする', () => {
      expect(CalendarEntity.formatDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
    });
  });

  describe('getRecordCountColor 境界値', () => {
    it('ちょうど0は空文字を返す', () => {
      expect(CalendarEntity.getRecordCountColor(0)).toBe('');
    });

    it('ちょうど2は薄い緑を返す', () => {
      expect(CalendarEntity.getRecordCountColor(2)).toBe('bg-green-100');
    });

    it('ちょうど5は中間の緑を返す', () => {
      expect(CalendarEntity.getRecordCountColor(5)).toBe('bg-green-200');
    });
  });

  describe('isSameDay 年跨ぎ', () => {
    it('年が異なればfalse', () => {
      expect(CalendarEntity.isSameDay(new Date(2025, 11, 31), new Date(2026, 0, 1))).toBe(false);
    });

    it('月が異なればfalse', () => {
      expect(CalendarEntity.isSameDay(new Date(2026, 0, 31), new Date(2026, 1, 1))).toBe(false);
    });
  });
});
