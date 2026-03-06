import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Date Span Days', () => {
  describe('getDateSpanDays', () => {
    it('空配列は0', () => {
      expect(DateRangeHelper.getDateSpanDays([])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-01'])).toBe(0);
    });

    it('同じ日付は0', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-01', '2026-01-01'])).toBe(0);
    });

    it('1日差', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-01', '2026-01-02'])).toBe(1);
    });

    it('1ヶ月差', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-01', '2026-02-01'])).toBe(31);
    });

    it('順序が不正でも正しく算出', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-10', '2026-01-01'])).toBe(9);
    });

    it('3件以上でも最初と最後の差', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-01', '2026-01-15', '2026-01-31'])).toBe(30);
    });

    it('1年差', () => {
      expect(DateRangeHelper.getDateSpanDays(['2025-01-01', '2026-01-01'])).toBe(365);
    });
  });

  describe('getDateSpanLabel', () => {
    it('0日は当日', () => {
      expect(DateRangeHelper.getDateSpanLabel(0)).toBe('当日');
    });

    it('7日は短期間', () => {
      expect(DateRangeHelper.getDateSpanLabel(7)).toBe('短期間');
    });

    it('30日は中期間', () => {
      expect(DateRangeHelper.getDateSpanLabel(30)).toBe('中期間');
    });

    it('90日以上は長期間', () => {
      expect(DateRangeHelper.getDateSpanLabel(90)).toBe('長期間');
    });
  });
});
