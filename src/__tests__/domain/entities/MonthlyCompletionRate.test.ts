import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Monthly Completion Rate', () => {
  describe('getMonthlyCompletionRate', () => {
    it('全日完了は100', () => {
      const dailyCompleted = [true, true, true, true, true];
      expect(CalendarEntity.getMonthlyCompletionRate(dailyCompleted)).toBe(100);
    });

    it('半分完了は50', () => {
      const dailyCompleted = [true, false, true, false];
      expect(CalendarEntity.getMonthlyCompletionRate(dailyCompleted)).toBe(50);
    });

    it('全日未完了は0', () => {
      const dailyCompleted = [false, false, false];
      expect(CalendarEntity.getMonthlyCompletionRate(dailyCompleted)).toBe(0);
    });

    it('空配列は0', () => {
      expect(CalendarEntity.getMonthlyCompletionRate([])).toBe(0);
    });

    it('1件完了は100', () => {
      expect(CalendarEntity.getMonthlyCompletionRate([true])).toBe(100);
    });
  });

  describe('getMonthlyCompletionLabel', () => {
    it('90以上は完璧', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(90)).toBe('完璧');
    });

    it('70以上は良好', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(70)).toBe('良好');
    });

    it('50以上はまずまず', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(50)).toBe('まずまず');
    });

    it('50未満は要改善', () => {
      expect(CalendarEntity.getMonthlyCompletionLabel(49)).toBe('要改善');
    });
  });
});
