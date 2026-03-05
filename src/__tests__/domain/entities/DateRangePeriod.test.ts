import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper 期間ラベル・日付差分', () => {
  describe('getPeriodLabel', () => {
    it('7日は「過去7日間」を返す', () => {
      expect(DateRangeHelper.getPeriodLabel(7)).toBe('過去7日間');
    });

    it('30日は「過去30日間」を返す', () => {
      expect(DateRangeHelper.getPeriodLabel(30)).toBe('過去30日間');
    });

    it('1日は「過去1日間」を返す', () => {
      expect(DateRangeHelper.getPeriodLabel(1)).toBe('過去1日間');
    });

    it('90日は「過去90日間」を返す', () => {
      expect(DateRangeHelper.getPeriodLabel(90)).toBe('過去90日間');
    });
  });

  describe('diffDays', () => {
    it('同じ日は0を返す', () => {
      const date = new Date('2026-03-05');
      expect(DateRangeHelper.diffDays(date, date)).toBe(0);
    });

    it('1日後は1を返す', () => {
      const from = new Date('2026-03-05');
      const to = new Date('2026-03-06');
      expect(DateRangeHelper.diffDays(from, to)).toBe(1);
    });

    it('過去の日は負の値を返す', () => {
      const from = new Date('2026-03-05');
      const to = new Date('2026-03-03');
      expect(DateRangeHelper.diffDays(from, to)).toBe(-2);
    });

    it('年跨ぎも正しく計算する', () => {
      const from = new Date('2025-12-30');
      const to = new Date('2026-01-02');
      expect(DateRangeHelper.diffDays(from, to)).toBe(3);
    });

    it('月末跨ぎも正しく計算する', () => {
      const from = new Date('2026-02-28');
      const to = new Date('2026-03-01');
      expect(DateRangeHelper.diffDays(from, to)).toBe(1);
    });
  });

  describe('isWithinDays', () => {
    it('範囲内ならtrueを返す', () => {
      const date = new Date('2026-03-03');
      const reference = new Date('2026-03-05');
      expect(DateRangeHelper.isWithinDays(date, reference, 7)).toBe(true);
    });

    it('ちょうど境界はtrueを返す', () => {
      const date = new Date('2026-02-26');
      const reference = new Date('2026-03-05');
      expect(DateRangeHelper.isWithinDays(date, reference, 7)).toBe(true);
    });

    it('範囲外はfalseを返す', () => {
      const date = new Date('2026-02-25');
      const reference = new Date('2026-03-05');
      expect(DateRangeHelper.isWithinDays(date, reference, 7)).toBe(false);
    });

    it('未来の日付もtrueを返す', () => {
      const date = new Date('2026-03-07');
      const reference = new Date('2026-03-05');
      expect(DateRangeHelper.isWithinDays(date, reference, 7)).toBe(true);
    });

    it('0日指定で同日のみtrue', () => {
      const date = new Date('2026-03-05');
      const reference = new Date('2026-03-05');
      expect(DateRangeHelper.isWithinDays(date, reference, 0)).toBe(true);
    });
  });
});
