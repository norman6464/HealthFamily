import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Goal Tracking Edge Cases', () => {
  describe('getGoalProgress', () => {
    it('負の現在値は0', () => {
      expect(AdherenceTrendEntity.getGoalProgress(-10, 100)).toBe(0);
    });

    it('負の目標は100', () => {
      expect(AdherenceTrendEntity.getGoalProgress(50, -10)).toBe(100);
    });

    it('ちょうど目標達成は100', () => {
      expect(AdherenceTrendEntity.getGoalProgress(100, 100)).toBe(100);
    });

    it('小さな目標値', () => {
      expect(AdherenceTrendEntity.getGoalProgress(1, 2)).toBe(50);
    });

    it('大きな超過', () => {
      expect(AdherenceTrendEntity.getGoalProgress(200, 100)).toBe(100);
    });
  });

  describe('getGoalProgressLabel', () => {
    it('99はあと少し', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(99)).toBe('あと少し');
    });

    it('70はあと少し', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(70)).toBe('あと少し');
    });

    it('69は半分', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(69)).toBe('半分');
    });

    it('40は半分', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(40)).toBe('半分');
    });

    it('39は頑張りましょう', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(39)).toBe('頑張りましょう');
    });

    it('0は頑張りましょう', () => {
      expect(AdherenceTrendEntity.getGoalProgressLabel(0)).toBe('頑張りましょう');
    });
  });
});
