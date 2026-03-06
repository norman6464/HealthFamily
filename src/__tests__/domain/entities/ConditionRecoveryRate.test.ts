import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Recovery Rate', () => {
  describe('getConditionRecoveryRate', () => {
    it('空配列は0', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([3])).toBe(0);
    });

    it('常に上昇は100', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([1, 2, 3, 4, 5])).toBe(100);
    });

    it('常に下降は0', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([5, 4, 3, 2, 1])).toBe(0);
    });

    it('横ばいは50', () => {
      expect(HealthLogEntity.getConditionRecoveryRate([3, 3, 3, 3])).toBe(50);
    });

    it('部分的に回復', () => {
      const result = HealthLogEntity.getConditionRecoveryRate([1, 3, 2, 4]);
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('部分的に悪化', () => {
      const result = HealthLogEntity.getConditionRecoveryRate([5, 3, 4, 2]);
      expect(result).toBeLessThan(50);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getRecoveryRateLabel', () => {
    it('高い回復率', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(80)).toBe('良好な回復');
    });

    it('中程度の回復率', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(50)).toBe('緩やかな回復');
    });

    it('低い回復率', () => {
      expect(HealthLogEntity.getRecoveryRateLabel(20)).toBe('回復が遅い');
    });
  });
});
