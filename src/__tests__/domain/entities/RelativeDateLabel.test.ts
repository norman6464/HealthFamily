import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Relative Date Label', () => {
  describe('getRelativeDateLabel', () => {
    it('今日は今日', () => {
      const today = new Date(2026, 2, 6);
      expect(DateRangeHelper.getRelativeDateLabel(today, today)).toBe('今日');
    });

    it('1日前は昨日', () => {
      const today = new Date(2026, 2, 6);
      const yesterday = new Date(2026, 2, 5);
      expect(DateRangeHelper.getRelativeDateLabel(yesterday, today)).toBe('昨日');
    });

    it('1日後は明日', () => {
      const today = new Date(2026, 2, 6);
      const tomorrow = new Date(2026, 2, 7);
      expect(DateRangeHelper.getRelativeDateLabel(tomorrow, today)).toBe('明日');
    });

    it('2日前はN日前', () => {
      const today = new Date(2026, 2, 6);
      const twoDaysAgo = new Date(2026, 2, 4);
      expect(DateRangeHelper.getRelativeDateLabel(twoDaysAgo, today)).toBe('2日前');
    });

    it('3日後はN日後', () => {
      const today = new Date(2026, 2, 6);
      const threeDaysLater = new Date(2026, 2, 9);
      expect(DateRangeHelper.getRelativeDateLabel(threeDaysLater, today)).toBe('3日後');
    });

    it('7日前は1週間前', () => {
      const today = new Date(2026, 2, 6);
      const weekAgo = new Date(2026, 1, 27);
      expect(DateRangeHelper.getRelativeDateLabel(weekAgo, today)).toBe('1週間前');
    });
  });

  describe('isConsecutiveDates', () => {
    it('連続する日付はtrue', () => {
      const dates = ['2026-03-04', '2026-03-05', '2026-03-06'];
      expect(DateRangeHelper.isConsecutiveDates(dates)).toBe(true);
    });

    it('飛びがある場合はfalse', () => {
      const dates = ['2026-03-04', '2026-03-06'];
      expect(DateRangeHelper.isConsecutiveDates(dates)).toBe(false);
    });

    it('空配列はtrue', () => {
      expect(DateRangeHelper.isConsecutiveDates([])).toBe(true);
    });

    it('1件はtrue', () => {
      expect(DateRangeHelper.isConsecutiveDates(['2026-03-06'])).toBe(true);
    });
  });
});
