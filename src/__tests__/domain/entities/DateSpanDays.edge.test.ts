import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Date Span Days Edge Cases', () => {
  describe('getDateSpanDays', () => {
    it('2件の同一日付は0', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-03-01', '2026-03-01'])).toBe(0);
    });

    it('年をまたぐ', () => {
      expect(DateRangeHelper.getDateSpanDays(['2025-12-31', '2026-01-01'])).toBe(1);
    });

    it('閏年の2月', () => {
      expect(DateRangeHelper.getDateSpanDays(['2024-02-28', '2024-03-01'])).toBe(2);
    });

    it('非閏年の2月', () => {
      expect(DateRangeHelper.getDateSpanDays(['2025-02-28', '2025-03-01'])).toBe(1);
    });

    it('大量の日付でも最初と最後の差', () => {
      const dates = Array.from({ length: 100 }, (_, i) => {
        const d = new Date('2026-01-01');
        d.setDate(d.getDate() + i);
        return DateRangeHelper.toDateKey(d);
      });
      expect(DateRangeHelper.getDateSpanDays(dates)).toBe(99);
    });

    it('逆順の3件', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-30', '2026-01-10', '2026-01-20'])).toBe(20);
    });

    it('重複を含む', () => {
      expect(DateRangeHelper.getDateSpanDays(['2026-01-01', '2026-01-01', '2026-01-10'])).toBe(9);
    });
  });

  describe('getDateSpanLabel', () => {
    it('1日は短期間', () => {
      expect(DateRangeHelper.getDateSpanLabel(1)).toBe('短期間');
    });

    it('13日は短期間', () => {
      expect(DateRangeHelper.getDateSpanLabel(13)).toBe('短期間');
    });

    it('14日は中期間（閾値境界）', () => {
      expect(DateRangeHelper.getDateSpanLabel(14)).toBe('中期間');
    });

    it('89日は中期間', () => {
      expect(DateRangeHelper.getDateSpanLabel(89)).toBe('中期間');
    });

    it('90日は長期間（閾値境界）', () => {
      expect(DateRangeHelper.getDateSpanLabel(90)).toBe('長期間');
    });

    it('365日は長期間', () => {
      expect(DateRangeHelper.getDateSpanLabel(365)).toBe('長期間');
    });
  });
});
