import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Weekday Record Balance Edge Cases', () => {
  describe('getWeekdayRecordBalance', () => {
    it('1件のみ(平日)', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([3]);
      expect(result.weekdayRate).toBe(100);
      expect(result.weekendRate).toBe(0);
    });

    it('1件のみ(休日)', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([0]);
      expect(result.weekdayRate).toBe(0);
      expect(result.weekendRate).toBe(100);
    });

    it('全て土曜', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([6, 6, 6]);
      expect(result.weekdayRate).toBe(0);
      expect(result.weekendRate).toBe(100);
    });

    it('日曜のみ', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([0]);
      expect(result.weekendRate).toBe(100);
    });

    it('大量データ(平日のみ)', () => {
      const days = Array(100).fill(0).map((_, i) => (i % 5) + 1);
      const result = CalendarEntity.getWeekdayRecordBalance(days);
      expect(result.weekdayRate).toBe(100);
    });

    it('合計が100になる', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([0, 1, 2, 3, 4, 5, 6]);
      expect(result.weekdayRate + result.weekendRate).toBe(100);
    });
  });

  describe('getWeekdayBalanceLabel', () => {
    it('境界値80/20は平日に偏り', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(80, 20)).toBe('平日に偏り');
    });

    it('境界値79/21はバランス良好', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(79, 21)).toBe('バランス良好');
    });

    it('境界値40/60は休日に偏り', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(40, 60)).toBe('休日に偏り');
    });

    it('境界値41/59はバランス良好', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(41, 59)).toBe('バランス良好');
    });

    it('50/50はバランス良好', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(50, 50)).toBe('バランス良好');
    });
  });
});
