import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Period Comparison Edge Cases', () => {
  describe('comparePeriods', () => {
    it('境界値差5で安定と判定', () => {
      const result = AdherenceTrendEntity.comparePeriods(70, 75);
      expect(result.direction).toBe('stable');
    });

    it('境界値差6で改善と判定', () => {
      const result = AdherenceTrendEntity.comparePeriods(70, 76);
      expect(result.direction).toBe('up');
    });

    it('0から100への変化', () => {
      const result = AdherenceTrendEntity.comparePeriods(0, 100);
      expect(result.change).toBe(100);
      expect(result.direction).toBe('up');
    });

    it('100から0への変化', () => {
      const result = AdherenceTrendEntity.comparePeriods(100, 0);
      expect(result.change).toBe(-100);
      expect(result.direction).toBe('down');
    });
  });

  describe('getImprovementMessage', () => {
    it('境界値15で大幅改善メッセージ', () => {
      expect(AdherenceTrendEntity.getImprovementMessage(15)).toBe('大幅に改善しています。素晴らしいです');
    });

    it('境界値14で小幅改善メッセージ', () => {
      expect(AdherenceTrendEntity.getImprovementMessage(14)).toBe('少しずつ改善しています');
    });

    it('境界値-1で悪化メッセージ', () => {
      expect(AdherenceTrendEntity.getImprovementMessage(-1)).toBe('少し服薬率が下がっています。一緒に頑張りましょう');
    });
  });

  describe('calculateConsistencyScore', () => {
    it('全て0で100を返す', () => {
      expect(AdherenceTrendEntity.calculateConsistencyScore([0, 0, 0])).toBe(100);
    });

    it('全て100で100を返す', () => {
      expect(AdherenceTrendEntity.calculateConsistencyScore([100, 100, 100])).toBe(100);
    });

    it('0と100の2値で低スコア', () => {
      const score = AdherenceTrendEntity.calculateConsistencyScore([0, 100]);
      expect(score).toBeLessThan(50);
    });
  });
});
