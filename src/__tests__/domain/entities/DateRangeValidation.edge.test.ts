import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper バリデーション エッジケース', () => {
  describe('isValidDateRange', () => {
    it('同一日時はtrueを返す', () => {
      const date = new Date('2026-03-01T00:00:00');
      expect(DateRangeHelper.isValidDateRange(date, date)).toBe(true);
    });

    it('1ミリ秒差でも順序が正しければtrue', () => {
      const from = new Date('2026-03-01T00:00:00.000');
      const to = new Date('2026-03-01T00:00:00.001');
      expect(DateRangeHelper.isValidDateRange(from, to)).toBe(true);
    });

    it('1ミリ秒差でも逆順ならfalse', () => {
      const from = new Date('2026-03-01T00:00:00.001');
      const to = new Date('2026-03-01T00:00:00.000');
      expect(DateRangeHelper.isValidDateRange(from, to)).toBe(false);
    });
  });

  describe('clampDate', () => {
    it('minとmaxが同一の場合はその日付を返す', () => {
      const date = new Date('2026-06-01');
      const bound = new Date('2026-03-01');
      expect(DateRangeHelper.clampDate(date, bound, bound)).toEqual(bound);
    });

    it('dateがminと同一の場合はそのまま返す', () => {
      const date = new Date('2026-01-01');
      expect(DateRangeHelper.clampDate(date, date, new Date('2026-12-31'))).toEqual(date);
    });
  });

  describe('getMonthRange', () => {
    it('2月の閏年は29日まで', () => {
      const { end } = DateRangeHelper.getMonthRange(2028, 1);
      expect(end.getDate()).toBe(29);
    });

    it('2月の平年は28日まで', () => {
      const { end } = DateRangeHelper.getMonthRange(2026, 1);
      expect(end.getDate()).toBe(28);
    });

    it('12月の範囲は1日から31日', () => {
      const { start, end } = DateRangeHelper.getMonthRange(2026, 11);
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(31);
    });
  });
});
