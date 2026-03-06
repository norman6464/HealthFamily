import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity - Condition Trend Prediction', () => {
  describe('predictNextCondition', () => {
    it('上昇傾向なら次の値も上がる', () => {
      const conditions = [2, 3, 4];
      const result = HealthLogEntity.predictNextCondition(conditions);
      expect(result).toBe(5);
    });

    it('下降傾向なら次の値も下がる', () => {
      const conditions = [5, 4, 3];
      const result = HealthLogEntity.predictNextCondition(conditions);
      expect(result).toBe(2);
    });

    it('安定傾向なら同じ値', () => {
      const conditions = [3, 3, 3];
      const result = HealthLogEntity.predictNextCondition(conditions);
      expect(result).toBe(3);
    });

    it('結果は1-5の範囲に制約される', () => {
      const conditions = [4, 5, 5];
      const result = HealthLogEntity.predictNextCondition(conditions);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(5);
    });

    it('空配列はnull', () => {
      expect(HealthLogEntity.predictNextCondition([])).toBeNull();
    });

    it('1件のみは同じ値', () => {
      expect(HealthLogEntity.predictNextCondition([4])).toBe(4);
    });
  });

  describe('getConditionPredictionMessage', () => {
    it('改善傾向のメッセージ', () => {
      expect(HealthLogEntity.getConditionPredictionMessage('improving')).toContain('改善');
    });

    it('悪化傾向のメッセージ', () => {
      expect(HealthLogEntity.getConditionPredictionMessage('declining')).toContain('注意');
    });

    it('安定傾向のメッセージ', () => {
      expect(HealthLogEntity.getConditionPredictionMessage('stable')).toContain('安定');
    });
  });
});
