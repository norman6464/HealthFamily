import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Goal Tracking', () => {
  describe('getGoalProgress', () => {
    it('目標達成率を算出', () => {
      const result = AdherenceTrendEntity.getGoalProgress(80, 100);
      expect(result).toBe(80);
    });

    it('目標を超えた場合は100', () => {
      expect(AdherenceTrendEntity.getGoalProgress(110, 100)).toBe(100);
    });

    it('目標0の場合は100', () => {
      expect(AdherenceTrendEntity.getGoalProgress(50, 0)).toBe(100);
    });

    it('0の場合は0', () => {
      expect(AdherenceTrendEntity.getGoalProgress(0, 100)).toBe(0);
    });
  });

  describe('getGoalProgressLabel', () => {
    it('100は達成', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(100)).toBe('達成');
    });

    it('80はあと少し', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(80)).toBe('あと少し');
    });

    it('50は半分', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(50)).toBe('半分');
    });

    it('20は頑張りましょう', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(20)).toBe('頑張りましょう');
    });
  });
});
