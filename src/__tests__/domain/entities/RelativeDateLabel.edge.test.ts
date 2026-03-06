import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Relative Date Label Edge Cases', () => {
  describe('getRelativeDateLabel', () => {
    it('14日前は2週間前', () => {
      const today = new Date(2026, 2, 6);
      const twoWeeksAgo = new Date(2026, 1, 20);
      expect(DateRangeHelper.getRelativeDateLabel(twoWeeksAgo, today)).toBe('2週間前');
    });

    it('14日後は2週間後', () => {
      const today = new Date(2026, 2, 6);
      const twoWeeksLater = new Date(2026, 2, 20);
      expect(DateRangeHelper.getRelativeDateLabel(twoWeeksLater, today)).toBe('2週間後');
    });

    it('6日前は6日前', () => {
      const today = new Date(2026, 2, 6);
      const sixDaysAgo = new Date(2026, 1, 28);
      expect(DateRangeHelper.getRelativeDateLabel(sixDaysAgo, today)).toBe('6日前');
    });

    it('8日後は8日後', () => {
      const today = new Date(2026, 2, 6);
      const eightDaysLater = new Date(2026, 2, 14);
      expect(DateRangeHelper.getRelativeDateLabel(eightDaysLater, today)).toBe('8日後');
    });
  });

  describe('isConsecutiveDates', () => {
    it('逆順は連続でない', () => {
      const dates = ['2026-03-06', '2026-03-05'];
      expect(DateRangeHelper.isConsecutiveDates(dates)).toBe(false);
    });

    it('同じ日付は連続でない', () => {
      const dates = ['2026-03-06', '2026-03-06'];
      expect(DateRangeHelper.isConsecutiveDates(dates)).toBe(false);
    });

    it('2日飛びは連続でない', () => {
      const dates = ['2026-03-04', '2026-03-06'];
      expect(DateRangeHelper.isConsecutiveDates(dates)).toBe(false);
    });

    it('月をまたぐ連続日付', () => {
      const dates = ['2026-02-28', '2026-03-01'];
      expect(DateRangeHelper.isConsecutiveDates(dates)).toBe(true);
    });

    it('長い連続日付', () => {
      const dates = Array.from({ length: 10 }, (_, i) => {
        const d = new Date(2026, 2, 1 + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      });
      expect(DateRangeHelper.isConsecutiveDates(dates)).toBe(true);
    });
  });
});
