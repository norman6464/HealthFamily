import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Monthly Completion Rate Edge Cases', () => {
  describe('getMonthlyCompletionRate', () => {
    it('31日分の大量データ', () => {
      const data = Array.from({ length: 31 }, (_, i) => i < 28);
      expect(CalendarEntity.getMonthlyCompletionRate(data)).toBe(90);
    });

    it('1件のみ未完了は0', () => {
      expect(CalendarEntity.getMonthlyCompletionRate([false])).toBe(0);
    });
  });

  describe('getMonthlyCompletionLabel', () => {
    it('境界値90は完璧', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(90)).toBe('完璧');
    });

    it('境界値89は良好', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(89)).toBe('良好');
    });

    it('境界値70は良好', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(70)).toBe('良好');
    });

    it('境界値69はまずまず', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(69)).toBe('まずまず');
    });

    it('境界値50はまずまず', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(50)).toBe('まずまず');
    });

    it('境界値49は要改善', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(49)).toBe('要改善');
    });

    it('0は要改善', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(0)).toBe('要改善');
    });

    it('100は完璧', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(100)).toBe('完璧');
    });
  });
});
