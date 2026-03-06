import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Momentum Edge Cases', () => {
  describe('getConditionMomentum', () => {
    it('2件のみで正の変化', () => {
      expect(HealthLogEntity.getConditionMomentum([1, 5])).toBe(4);
    });

    it('2件のみで負の変化', () => {
      expect(HealthLogEntity.getConditionMomentum([5, 1])).toBe(-4);
    });

    it('2件で同値', () => {
      expect(HealthLogEntity.getConditionMomentum([3, 3])).toBe(0);
    });

    it('直近3件のみ使用される（4件以上）', () => {
      const result = HealthLogEntity.getConditionMomentum([1, 1, 1, 3, 5]);
      expect(result).toBeGreaterThan(0);
    });

    it('先頭が異なっても直近3件が横ばいなら0', () => {
      expect(HealthLogEntity.getConditionMomentum([1, 5, 3, 3, 3])).toBe(0);
    });

    it('最小値のみの配列', () => {
      expect(HealthLogEntity.getConditionMomentum([1, 1, 1])).toBe(0);
    });

    it('最大値のみの配列', () => {
      expect(HealthLogEntity.getConditionMomentum([5, 5, 5])).toBe(0);
    });

    it('急激な上昇', () => {
      expect(HealthLogEntity.getConditionMomentum([1, 3, 5])).toBe(2);
    });

    it('急激な下降', () => {
      expect(HealthLogEntity.getConditionMomentum([5, 3, 1])).toBe(-2);
    });

    it('V字回復は差分が相殺され0', () => {
      expect(HealthLogEntity.getConditionMomentum([5, 1, 5])).toBe(0);
    });

    it('逆V字は差分が相殺され0', () => {
      expect(HealthLogEntity.getConditionMomentum([1, 5, 1])).toBe(0);
    });

    it('小数の平均が正しく丸められる', () => {
      const result = HealthLogEntity.getConditionMomentum([1, 2, 4]);
      expect(result).toBe(1.5);
    });

    it('長い配列でも直近3件のみ', () => {
      const result = HealthLogEntity.getConditionMomentum([5, 4, 3, 2, 1, 2, 3]);
      expect(result).toBe(1);
    });
  });

  describe('getMomentumLabel', () => {
    it('閾値ちょうど0.5は改善傾向', () => {
      expect(HealthLogEntity.getMomentumLabel(0.5)).toBe('改善傾向');
    });

    it('閾値ちょうど-0.5は悪化傾向', () => {
      expect(HealthLogEntity.getMomentumLabel(-0.5)).toBe('悪化傾向');
    });

    it('0.49は変化なし', () => {
      expect(HealthLogEntity.getMomentumLabel(0.49)).toBe('変化なし');
    });

    it('-0.49は変化なし', () => {
      expect(HealthLogEntity.getMomentumLabel(-0.49)).toBe('変化なし');
    });

    it('大きな正の値は改善傾向', () => {
      expect(HealthLogEntity.getMomentumLabel(10)).toBe('改善傾向');
    });

    it('大きな負の値は悪化傾向', () => {
      expect(HealthLogEntity.getMomentumLabel(-10)).toBe('悪化傾向');
    });

    it('ちょうど0は変化なし', () => {
      expect(HealthLogEntity.getMomentumLabel(0)).toBe('変化なし');
    });
  });
});
