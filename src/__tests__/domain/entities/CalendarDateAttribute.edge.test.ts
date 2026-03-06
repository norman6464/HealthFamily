import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity 日付選択ヘルパー エッジケース', () => {
  describe('getDateAttribute', () => {
    it('年末と年始は異なる日と判定する', () => {
      const dec31 = new Date('2025-12-31');
      const jan1 = new Date('2026-01-01');
      expect(CalendarEntity.getDateAttribute(dec31, jan1)).toBe('past');
    });

    it('同日の異なる時刻はtodayを返す', () => {
      const morning = new Date('2025-06-15T08:00:00');
      const evening = new Date('2025-06-15T20:00:00');
      expect(CalendarEntity.getDateAttribute(morning, evening)).toBe('today');
    });
  });

  describe('isDateInCurrentMonth', () => {
    it('うるう年2月29日は2月に含まれる', () => {
      expect(CalendarEntity.isDateInCurrentMonth(new Date('2024-02-29'), 2024, 1)).toBe(true);
    });

    it('異なる年の同月はfalseを返す', () => {
      expect(CalendarEntity.isDateInCurrentMonth(new Date('2024-06-15'), 2025, 5)).toBe(false);
    });
  });

  describe('getDateStatusLabel', () => {
    it('全属性にラベルが返る', () => {
      const attrs: ('today' | 'past' | 'future')[] = ['today', 'past', 'future'];
      for (const a of attrs) {
        expect(CalendarEntity.getDateStatusLabel(a)).toBeTruthy();
      }
    });
  });
});
