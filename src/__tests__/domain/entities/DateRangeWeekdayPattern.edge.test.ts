import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Weekday Pattern Edge Cases', () => {
  describe('getWeekdayDistribution', () => {
    it('年跨ぎの期間で正しく計算する', () => {
      const from = new Date('2025-12-29'); // 月曜
      const to = new Date('2026-01-04');   // 日曜
      const result = DateRangeHelper.getWeekdayDistribution(from, to);
      expect(result.reduce((a, b) => a + b, 0)).toBe(7);
    });

    it('月末から月初への期間', () => {
      const from = new Date('2026-02-28');
      const to = new Date('2026-03-01');
      const result = DateRangeHelper.getWeekdayDistribution(from, to);
      expect(result.reduce((a, b) => a + b, 0)).toBe(2);
    });
  });

  describe('isSameWeek', () => {
    it('年跨ぎでも同じ週なら同一判定', () => {
      const wed = new Date('2025-12-31'); // 水曜
      const thu = new Date('2026-01-01'); // 木曜
      expect(DateRangeHelper.isSameWeek(wed, thu)).toBe(true);
    });

    it('日曜と翌日曜は異なる週', () => {
      const sun1 = new Date('2026-03-01');
      const sun2 = new Date('2026-03-08');
      expect(DateRangeHelper.isSameWeek(sun1, sun2)).toBe(false);
    });
  });

  describe('getWeekRange', () => {
    it('年末の週範囲が正しい', () => {
      const dec31 = new Date('2025-12-31'); // 水曜
      const { start, end } = DateRangeHelper.getWeekRange(dec31);
      expect(start.getDay()).toBe(0);
      expect(end.getDay()).toBe(6);
    });

    it('開始と終了の差が6日', () => {
      const date = new Date('2026-03-05');
      const { start, end } = DateRangeHelper.getWeekRange(date);
      const diff = DateRangeHelper.diffDays(start, end);
      expect(diff).toBe(6);
    });
  });
});
