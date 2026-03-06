import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Recovery Rate Edge Cases', () => {
  describe('getConditionRecoveryRate', () => {
    it('2件で上昇は100', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([1, 5])).toBe(100);
    });

    it('2件で下降は0', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([5, 1])).toBe(0);
    });

    it('2件で横ばいは50', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([3, 3])).toBe(50);
    });

    it('大きな配列で全て同じ値', () => {
      const conditions = Array(100).fill(3);
      expect(HealthLogEntity.getConditionRecoveryRate(conditions)).toBe(50);
    });

    it('交互に上下', () => {
      const result = HealthLogEntity.getConditionRecoveryRate([1, 5, 1, 5, 1]);
      expect(result).toBe(50);
    });

    it('最小値から最大値への段階的回復', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([1, 2, 3, 4, 5])).toBe(100);
    });

    it('最大値から最小値への段階的悪化', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([5, 4, 3, 2, 1])).toBe(0);
    });

    it('結果が0-100の範囲内', () => {
      const result = HealthLogEntity.getConditionRecoveryRate([1, 5, 1, 5, 1, 5]);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('getRecoveryRateLabel', () => {
    it('境界値70は良好な回復', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(70)).toBe('良好な回復');
    });

    it('境界値69は緩やかな回復', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(69)).toBe('緩やかな回復');
    });

    it('境界値40は緩やかな回復', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(40)).toBe('緩やかな回復');
    });

    it('境界値39は回復が遅い', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(39)).toBe('回復が遅い');
    });

    it('0は回復が遅い', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(0)).toBe('回復が遅い');
    });

    it('100は良好な回復', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(100)).toBe('良好な回復');
    });
  });
});
