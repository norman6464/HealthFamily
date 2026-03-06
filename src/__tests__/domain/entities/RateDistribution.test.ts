import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Rate Distribution', () => {
  describe('getRateDistribution', () => {
    it('空配列は全て0', () => {
      const result = AdherenceTrendEntity.getRateDistribution([]);
      expect(result).toEqual({ high: 0, medium: 0, low: 0 });
    });

    it('全て高い率', () => {
      const result = AdherenceTrendEntity.getRateDistribution([90, 95, 100]);
      expect(result.high).toBe(100);
      expect(result.medium).toBe(0);
      expect(result.low).toBe(0);
    });

    it('全て低い率', () => {
      const result = AdherenceTrendEntity.getRateDistribution([10, 20, 30]);
      expect(result.low).toBe(100);
      expect(result.high).toBe(0);
    });

    it('混在', () => {
      const result = AdherenceTrendEntity.getRateDistribution([90, 60, 30, 10]);
      expect(result.high).toBe(25);
      expect(result.medium).toBe(25);
      expect(result.low).toBe(50);
    });

    it('境界値70は中', () => {
      const result = AdherenceTrendEntity.getRateDistribution([70]);
      expect(result.medium).toBe(100);
    });

    it('境界値80は高', () => {
      const result = AdherenceTrendEntity.getRateDistribution([80]);
      expect(result.high).toBe(100);
    });

    it('境界値50は中', () => {
      const result = AdherenceTrendEntity.getRateDistribution([50]);
      expect(result.medium).toBe(100);
    });

    it('境界値49は低', () => {
      const result = AdherenceTrendEntity.getRateDistribution([49]);
      expect(result.low).toBe(100);
    });
  });

  describe('getRateDistributionLabel', () => {
    it('高い率が多い場合', () => {
      expect(AdherenceTrendEntity.getRateDistributionLabel({ high: 60, medium: 20, low: 20 })).toBe('安定して高い');
    });

    it('低い率が多い場合', () => {
      expect(AdherenceTrendEntity.getRateDistributionLabel({ high: 10, medium: 20, low: 70 })).toBe('改善が必要');
    });

    it('均等な場合', () => {
      expect(AdherenceTrendEntity.getRateDistributionLabel({ high: 33, medium: 34, low: 33 })).toBe('ばらつきあり');
    });
  });
});
