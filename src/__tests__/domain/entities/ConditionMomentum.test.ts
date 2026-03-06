import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Momentum', () => {
  describe('getConditionMomentum', () => {
    it('空配列は0', () => {
      expect(HealthLogEntity.getConditionMomentum([])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(HealthLogEntity.getConditionMomentum([3])).toBe(0);
    });

    it('上昇傾向は正', () => {
      expect(HealthLogEntity.getConditionMomentum([1, 2, 3, 4, 5])).toBeGreaterThan(0);
    });

    it('下降傾向は負', () => {
      expect(HealthLogEntity.getConditionMomentum([5, 4, 3, 2, 1])).toBeLessThan(0);
    });

    it('横ばいは0', () => {
      expect(HealthLogEntity.getConditionMomentum([3, 3, 3, 3])).toBe(0);
    });

    it('直近3件の変化を反映', () => {
      const result = HealthLogEntity.getConditionMomentum([1, 1, 1, 3, 5]);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getMomentumLabel', () => {
    it('正のモメンタム', () => {
      expect(HealthLogEntity.getMomentumLabel(1.5)).toBe('改善傾向');
    });

    it('負のモメンタム', () => {
      expect(HealthLogEntity.getMomentumLabel(-1.5)).toBe('悪化傾向');
    });

    it('ゼロ付近', () => {
      expect(HealthLogEntity.getMomentumLabel(0.3)).toBe('変化なし');
    });
  });
});
