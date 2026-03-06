import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper バリデーションユーティリティ', () => {
  describe('isValidDateRange', () => {
    it('開始日が終了日より前ならtrue', () => {
      expect(DateRangeHelper.isValidDateRange(
        new Date('2026-03-01'), new Date('2026-03-05'),
      )).toBe(true);
    });

    it('開始日と終了日が同じならtrue', () => {
      expect(DateRangeHelper.isValidDateRange(
        new Date('2026-03-01'), new Date('2026-03-01'),
      )).toBe(true);
    });

    it('開始日が終了日より後ならfalse', () => {
      expect(DateRangeHelper.isValidDateRange(
        new Date('2026-03-05'), new Date('2026-03-01'),
      )).toBe(false);
    });
  });

  describe('clampDate', () => {
    it('範囲内の日付はそのまま返す', () => {
      const date = new Date('2026-03-03');
      const min = new Date('2026-03-01');
      const max = new Date('2026-03-05');
      expect(DateRangeHelper.clampDate(date, min, max).getTime()).toBe(date.getTime());
    });

    it('最小値より前の日付は最小値を返す', () => {
      const date = new Date('2026-02-28');
      const min = new Date('2026-03-01');
      const max = new Date('2026-03-05');
      expect(DateRangeHelper.clampDate(date, min, max).getTime()).toBe(min.getTime());
    });

    it('最大値より後の日付は最大値を返す', () => {
      const date = new Date('2026-03-10');
      const min = new Date('2026-03-01');
      const max = new Date('2026-03-05');
      expect(DateRangeHelper.clampDate(date, min, max).getTime()).toBe(max.getTime());
    });

    it('境界値と同じ日付はそのまま返す', () => {
      const min = new Date('2026-03-01');
      const max = new Date('2026-03-05');
      expect(DateRangeHelper.clampDate(min, min, max).getTime()).toBe(min.getTime());
      expect(DateRangeHelper.clampDate(max, min, max).getTime()).toBe(max.getTime());
    });
  });

  describe('getMonthRange', () => {
    it('3月の範囲を返す', () => {
      const range = DateRangeHelper.getMonthRange(2026, 2);
      expect(DateRangeHelper.toDateKey(range.start)).toBe('2026-03-01');
      expect(DateRangeHelper.toDateKey(range.end)).toBe('2026-03-31');
    });

    it('2月の範囲を返す（閏年）', () => {
      const range = DateRangeHelper.getMonthRange(2024, 1);
      expect(DateRangeHelper.toDateKey(range.start)).toBe('2024-02-01');
      expect(DateRangeHelper.toDateKey(range.end)).toBe('2024-02-29');
    });

    it('2月の範囲を返す（平年）', () => {
      const range = DateRangeHelper.getMonthRange(2026, 1);
      expect(DateRangeHelper.toDateKey(range.start)).toBe('2026-02-01');
      expect(DateRangeHelper.toDateKey(range.end)).toBe('2026-02-28');
    });

    it('12月の範囲を返す', () => {
      const range = DateRangeHelper.getMonthRange(2026, 11);
      expect(DateRangeHelper.toDateKey(range.start)).toBe('2026-12-01');
      expect(DateRangeHelper.toDateKey(range.end)).toBe('2026-12-31');
    });
  });
});
