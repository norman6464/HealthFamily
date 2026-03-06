import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Period Score', () => {
  describe('getPeriodAverageCondition', () => {
    it('条件値の平均を返す', () => {
      const logs = [
        { condition: 3 },
        { condition: 4 },
        { condition: 5 },
      ];
      expect(HealthLogEntity.getPeriodAverageCondition(logs)).toBe(4);
    });

    it('小数点第1位まで返す', () => {
      const logs = [
        { condition: 3 },
        { condition: 4 },
      ];
      expect(HealthLogEntity.getPeriodAverageCondition(logs)).toBe(3.5);
    });

    it('空配列で0を返す', () => {
      expect(HealthLogEntity.getPeriodAverageCondition([])).toBe(0);
    });

    it('1件でその値を返す', () => {
      expect(HealthLogEntity.getPeriodAverageCondition([{ condition: 5 }])).toBe(5);
    });
  });

  describe('getConditionStabilityScore', () => {
    it('全て同じ値で100を返す', () => {
      expect(HealthLogEntity.getConditionStabilityScore([3, 3, 3])).toBe(100);
    });

    it('ばらつきが大きいと低スコアを返す', () => {
      const score = HealthLogEntity.getConditionStabilityScore([1, 5, 1, 5]);
      expect(score).toBeLessThan(50);
    });

    it('空配列で0を返す', () => {
      expect(HealthLogEntity.getConditionStabilityScore([])).toBe(0);
    });

    it('1要素で100を返す', () => {
      expect(HealthLogEntity.getConditionStabilityScore([4])).toBe(100);
    });

    it('スコアは0-100の範囲', () => {
      const score = HealthLogEntity.getConditionStabilityScore([1, 5, 1, 5, 1, 5]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getConditionComparisonLabel', () => {
    it('改善でラベルを返す', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(3, 4.5)).toBe('体調が改善しています');
    });

    it('悪化でラベルを返す', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(4, 2.5)).toBe('体調がやや低下しています');
    });

    it('変化なしでラベルを返す', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(3.5, 3.8)).toBe('体調は安定しています');
    });

    it('同値で安定ラベルを返す', () => {
      expect(HealthLogEntity.getConditionComparisonLabel(4, 4)).toBe('体調は安定しています');
    });
  });
});
