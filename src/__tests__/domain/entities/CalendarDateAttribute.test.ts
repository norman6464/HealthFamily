import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity 日付選択ヘルパー', () => {
  describe('getDateAttribute', () => {
    const today = new Date('2025-06-15');

    it('今日はtodayを返す', () => {
      expect(CalendarEntity.getDateAttribute(new Date('2025-06-15'), today)).toBe('today');
    });

    it('昨日はpastを返す', () => {
      expect(CalendarEntity.getDateAttribute(new Date('2025-06-14'), today)).toBe('past');
    });

    it('明日はfutureを返す', () => {
      expect(CalendarEntity.getDateAttribute(new Date('2025-06-16'), today)).toBe('future');
    });

    it('1週間前はpastを返す', () => {
      expect(CalendarEntity.getDateAttribute(new Date('2025-06-08'), today)).toBe('past');
    });
  });

  describe('isDateInCurrentMonth', () => {
    it('同月の日付はtrueを返す', () => {
      expect(CalendarEntity.isDateInCurrentMonth(new Date('2025-06-15'), 2025, 5)).toBe(true);
    });

    it('前月の日付はfalseを返す', () => {
      expect(CalendarEntity.isDateInCurrentMonth(new Date('2025-05-31'), 2025, 5)).toBe(false);
    });

    it('翌月の日付はfalseを返す', () => {
      expect(CalendarEntity.isDateInCurrentMonth(new Date('2025-07-01'), 2025, 5)).toBe(false);
    });

    it('1月の判定（monthは0-indexed）', () => {
      expect(CalendarEntity.isDateInCurrentMonth(new Date('2025-01-15'), 2025, 0)).toBe(true);
    });

    it('12月の判定', () => {
      expect(CalendarEntity.isDateInCurrentMonth(new Date('2025-12-25'), 2025, 11)).toBe(true);
    });
  });

  describe('getDateStatusLabel', () => {
    it('todayは今日を返す', () => {
      expect(CalendarEntity.getDateStatusLabel('today')).toBe('今日');
    });

    it('pastは過去を返す', () => {
      expect(CalendarEntity.getDateStatusLabel('past')).toBe('過去');
    });

    it('futureは未来を返す', () => {
      expect(CalendarEntity.getDateStatusLabel('future')).toBe('未来');
    });
  });
});
