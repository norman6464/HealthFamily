import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Rate Distribution Edge Cases', () => {
  describe('getRateDistribution', () => {
    it('1件のみ(高)', () => {
      const result = AdherenceTrendEntity.getRateDistribution([100]);
      expect(result.high).toBe(100);
    });

    it('境界値79は中', () => {
      const result = AdherenceTrendEntity.getRateDistribution([79]);
      expect(result.medium).toBe(100);
    });

    it('0は低', () => {
      const result = AdherenceTrendEntity.getRateDistribution([0]);
      expect(result.low).toBe(100);
    });

    it('100は高', () => {
      const result = AdherenceTrendEntity.getRateDistribution([100]);
      expect(result.high).toBe(100);
    });

    it('同じ値が多数', () => {
      const result = AdherenceTrendEntity.getRateDistribution([80, 80, 80, 80, 80]);
      expect(result.high).toBe(100);
      expect(result.medium).toBe(0);
      expect(result.low).toBe(0);
    });

    it('丸め誤差で合計が100にならないケース', () => {
      const result = AdherenceTrendEntity.getRateDistribution([90, 60, 10]);
      expect(result.high + result.medium + result.low).toBeGreaterThanOrEqual(99);
      expect(result.high + result.medium + result.low).toBeLessThanOrEqual(101);
    });
  });

  describe('getRateDistributionLabel', () => {
    it('高が丁度50は安定して高い', () => {
      expect(AdherenceTrendEntity.getRateDistributionLabel({ high: 50, medium: 25, low: 25 })).toBe('安定して高い');
    });

    it('低が丁度50は改善が必要', () => {
      expect(AdherenceTrendEntity.getRateDistributionLabel({ high: 25, medium: 25, low: 50 })).toBe('改善が必要');
    });

    it('全て0', () => {
      expect(AdherenceTrendEntity.getRateDistributionLabel({ high: 0, medium: 0, low: 0 })).toBe('ばらつきあり');
    });

    it('高49/低49はばらつきあり', () => {
      expect(AdherenceTrendEntity.getRateDistributionLabel({ high: 49, medium: 2, low: 49 })).toBe('ばらつきあり');
    });
  });
});
