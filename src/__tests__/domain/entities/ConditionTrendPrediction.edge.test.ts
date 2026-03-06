import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Prediction Edge Cases', () => {
  describe('predictNextCondition', () => {
    it('上限5を超えない', () => {
      expect(HealthLogEntity.predictNextCondition([4, 5])).toBe(5);
    });

    it('下限1を下回らない', () => {
      expect(HealthLogEntity.predictNextCondition([2, 1])).toBe(1);
    });

    it('急激な変動（1→5）', () => {
      expect(HealthLogEntity.predictNextCondition([1, 5])).toBe(5);
    });

    it('急激な変動（5→1）', () => {
      expect(HealthLogEntity.predictNextCondition([5, 1])).toBe(1);
    });

    it('2件のデータ', () => {
      expect(HealthLogEntity.predictNextCondition([3, 4])).toBe(5);
    });

    it('長い配列は末尾2つのみ使用', () => {
      expect(HealthLogEntity.predictNextCondition([1, 1, 1, 1, 3, 4])).toBe(5);
    });

    it('小数値は丸められる', () => {
      const result = HealthLogEntity.predictNextCondition([3, 3.5]);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('getConditionPredictionMessage', () => {
    it('improving', () => {
      const msg = HealthLogEntity.getConditionPredictionMessage('improving');
      expect(msg.length).toBeGreaterThan(0);
    });

    it('declining', () => {
      const msg = HealthLogEntity.getConditionPredictionMessage('declining');
      expect(msg.length).toBeGreaterThan(0);
    });

    it('stable', () => {
      const msg = HealthLogEntity.getConditionPredictionMessage('stable');
      expect(msg.length).toBeGreaterThan(0);
    });
  });
});
