import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Period Score Edge Cases', () => {
  describe('getPeriodAverageCondition', () => {
    it('全て1の場合1.0を返す', () => {
      const logs = [{ condition: 1 }, { condition: 1 }, { condition: 1 }];
      expect(HealthLogEntity.getPeriodAverageCondition(logs)).toBe(1);
    });

    it('全て5の場合5.0を返す', () => {
      const logs = [{ condition: 5 }, { condition: 5 }];
      expect(HealthLogEntity.getPeriodAverageCondition(logs)).toBe(5);
    });

    it('1と5の平均で3.0を返す', () => {
      expect(HealthLogEntity.getPeriodAverageCondition([{ condition: 1 }, { condition: 5 }])).toBe(3);
    });
  });

  describe('getConditionStabilityScore', () => {
    it('1と5の繰り返しで低スコア', () => {
      const score = HealthLogEntity.getConditionStabilityScore([1, 5, 1, 5]);
      expect(score).toBeLessThan(50);
    });

    it('近い値のばらつきで高スコア', () => {
      const score = HealthLogEntity.getConditionStabilityScore([3, 4, 3, 4, 3]);
      expect(score).toBeGreaterThan(70);
    });

    it('2要素同値で100', () => {
      expect(HealthLogEntity.getConditionStabilityScore([5, 5])).toBe(100);
    });
  });

  describe('getConditionComparisonLabel', () => {
    it('境界値差1.0で改善', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(3, 4)).toBe('体調が改善しています');
    });

    it('境界値差0.9で安定', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(3, 3.9)).toBe('体調は安定しています');
    });

    it('境界値差-1.0で悪化', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(4, 3)).toBe('体調がやや低下しています');
    });

    it('境界値差-0.9で安定', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(4, 3.1)).toBe('体調は安定しています');
    });
  });
});
