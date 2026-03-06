import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Variance', () => {
  describe('getConditionVariance', () => {
    it('空配列は0', () => {
      expect(HealthLogEntity.getConditionVariance([])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(HealthLogEntity.getConditionVariance([3])).toBe(0);
    });

    it('全て同じ値は0', () => {
      expect(HealthLogEntity.getConditionVariance([3, 3, 3, 3])).toBe(0);
    });

    it('最大と最小のみ', () => {
      const result = HealthLogEntity.getConditionVariance([1, 5]);
      expect(result).toBeGreaterThan(0);
    });

    it('分散値が正しく算出される', () => {
      const result = HealthLogEntity.getConditionVariance([1, 2, 3, 4, 5]);
      expect(result).toBe(2);
    });

    it('ばらつきが小さい', () => {
      const result = HealthLogEntity.getConditionVariance([3, 3, 4, 3, 3]);
      expect(result).toBeLessThan(1);
    });

    it('ばらつきが大きい', () => {
      const result = HealthLogEntity.getConditionVariance([1, 5, 1, 5]);
      expect(result).toBe(4);
    });
  });

  describe('getConditionVarianceLabel', () => {
    it('低分散は安定', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(0.5)).toBe('安定');
    });

    it('中程度の分散はやや不安定', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(2)).toBe('やや不安定');
    });

    it('高分散は不安定', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(4)).toBe('不安定');
    });
  });
});
