import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Volatility', () => {
  describe('getConditionVolatility', () => {
    it('安定した体調は低いスコア', () => {
      const conditions = [3, 3, 3, 3, 3];
      const score = HealthLogEntity.getConditionVolatility(conditions);
      expect(score).toBe(0);
    });

    it('変動が大きいと高いスコア', () => {
      const conditions = [1, 5, 1, 5, 1];
      const score = HealthLogEntity.getConditionVolatility(conditions);
      expect(score).toBeGreaterThan(50);
    });

    it('1件のみは0', () => {
      expect(HealthLogEntity.getConditionVolatility([3])).toBe(0);
    });

    it('空配列は0', () => {
      expect(HealthLogEntity.getConditionVolatility([])).toBe(0);
    });

    it('徐々に変化する場合は中程度', () => {
      const conditions = [1, 2, 3, 4, 5];
      const score = HealthLogEntity.getConditionVolatility(conditions);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(80);
    });

    it('スコアは0-100の範囲', () => {
      const conditions = [1, 5, 1, 5, 1, 5];
      const score = HealthLogEntity.getConditionVolatility(conditions);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getVolatilityLabel', () => {
    it('0は安定', () => {
      expect(HealthLogEntity.getVolatilityLabel(0)).toBe('安定');
    });

    it('30は安定', () => {
      expect(HealthLogEntity.getVolatilityLabel(30)).toBe('安定');
    });

    it('31はやや変動', () => {
      expect(HealthLogEntity.getVolatilityLabel(31)).toBe('やや変動');
    });

    it('60はやや変動', () => {
      expect(HealthLogEntity.getVolatilityLabel(60)).toBe('やや変動');
    });

    it('61は不安定', () => {
      expect(HealthLogEntity.getVolatilityLabel(61)).toBe('不安定');
    });

    it('100は不安定', () => {
      expect(HealthLogEntity.getVolatilityLabel(100)).toBe('不安定');
    });
  });
});
