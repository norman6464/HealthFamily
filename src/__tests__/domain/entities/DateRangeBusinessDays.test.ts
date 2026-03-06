import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper 営業日計算', () => {
  describe('isBusinessDay', () => {
    it('月曜日は営業日', () => {
      expect(DateRangeHelper.isBusinessDay(new Date(2026, 2, 2))).toBe(true);
    });

    it('土曜日は営業日ではない', () => {
      expect(DateRangeHelper.isBusinessDay(new Date(2026, 2, 7))).toBe(false);
    });

    it('日曜日は営業日ではない', () => {
      expect(DateRangeHelper.isBusinessDay(new Date(2026, 2, 1))).toBe(false);
    });

    it('金曜日は営業日', () => {
      expect(DateRangeHelper.isBusinessDay(new Date(2026, 2, 6))).toBe(true);
    });
  });

  describe('countBusinessDays', () => {
    it('月-金の1週間は5営業日', () => {
      const from = new Date(2026, 2, 2); // 月
      const to = new Date(2026, 2, 6); // 金
      expect(DateRangeHelper.countBusinessDays(from, to)).toBe(5);
    });

    it('月-日の1週間は5営業日', () => {
      const from = new Date(2026, 2, 2); // 月
      const to = new Date(2026, 2, 8); // 日
      expect(DateRangeHelper.countBusinessDays(from, to)).toBe(5);
    });

    it('同じ日は営業日なら1を返す', () => {
      const date = new Date(2026, 2, 2); // 月
      expect(DateRangeHelper.countBusinessDays(date, date)).toBe(1);
    });

    it('同じ日が土曜なら0を返す', () => {
      const date = new Date(2026, 2, 7); // 土
      expect(DateRangeHelper.countBusinessDays(date, date)).toBe(0);
    });

    it('2週間は10営業日', () => {
      const from = new Date(2026, 2, 2); // 月
      const to = new Date(2026, 2, 13); // 金
      expect(DateRangeHelper.countBusinessDays(from, to)).toBe(10);
    });
  });

  describe('addBusinessDays', () => {
    it('月曜に3営業日加算すると木曜', () => {
      const result = DateRangeHelper.addBusinessDays(new Date(2026, 2, 2), 3);
      expect(result.getDate()).toBe(5); // 木曜
    });

    it('金曜に1営業日加算すると月曜', () => {
      const result = DateRangeHelper.addBusinessDays(new Date(2026, 2, 6), 1);
      expect(result.getDate()).toBe(9); // 月曜
    });

    it('0営業日加算は同日を返す', () => {
      const date = new Date(2026, 2, 2);
      const result = DateRangeHelper.addBusinessDays(date, 0);
      expect(result.getDate()).toBe(2);
    });

    it('5営業日加算で翌週金曜', () => {
      const result = DateRangeHelper.addBusinessDays(new Date(2026, 2, 2), 5);
      expect(result.getDate()).toBe(9); // 翌月曜
    });
  });
});
