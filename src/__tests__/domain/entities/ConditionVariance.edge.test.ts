import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Variance Edge Cases', () => {
  describe('getConditionVariance', () => {
    it('2件で同値は0', () => {
      expect(HealthLogEntity.getConditionVariance([3, 3])).toBe(0);
    });

    it('2件で最大差', () => {
      const result = HealthLogEntity.getConditionVariance([1, 5]);
      expect(result).toBe(4);
    });

    it('大量データで同値', () => {
      const data = Array.from({ length: 100 }, () => 3);
      expect(HealthLogEntity.getConditionVariance(data)).toBe(0);
    });

    it('大量データでばらつき', () => {
      const data = Array.from({ length: 100 }, (_, i) => (i % 5) + 1);
      expect(HealthLogEntity.getConditionVariance(data)).toBeGreaterThan(0);
    });

    it('全て最小値', () => {
      expect(HealthLogEntity.getConditionVariance([1, 1, 1, 1])).toBe(0);
    });

    it('全て最大値', () => {
      expect(HealthLogEntity.getConditionVariance([5, 5, 5, 5])).toBe(0);
    });

    it('小数点第2位で丸められる', () => {
      const result = HealthLogEntity.getConditionVariance([1, 2, 3]);
      expect(result).toBe(0.67);
    });
  });

  describe('getConditionVarianceLabel', () => {
    it('0は安定', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(0)).toBe('安定');
    });

    it('0.99は安定', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(0.99)).toBe('安定');
    });

    it('1はやや不安定（閾値境界）', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(1)).toBe('やや不安定');
    });

    it('2.99はやや不安定', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(2.99)).toBe('やや不安定');
    });

    it('3は不安定（閾値境界）', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(3)).toBe('不安定');
    });

    it('10は不安定', () => {
      expect(HealthLogEntity.getConditionVarianceLabel(10)).toBe('不安定');
    });
  });
});
