import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Period Comparison', () => {
  describe('comparePeriods', () => {
    it('改善を正しく検出する', () => {
      const result = AdherenceTrendEntity.comparePeriods(60, 80);
      expect(result.change).toBe(20);
      expect(result.direction).toBe('up');
      expect(result.changePercentage).toBe(20);
    });

    it('悪化を正しく検出する', () => {
      const result = AdherenceTrendEntity.comparePeriods(80, 60);
      expect(result.change).toBe(-20);
      expect(result.direction).toBe('down');
    });

    it('安定を正しく検出する', () => {
      const result = AdherenceTrendEntity.comparePeriods(75, 78);
      expect(result.direction).toBe('stable');
    });

    it('同値で安定を返す', () => {
      const result = AdherenceTrendEntity.comparePeriods(80, 80);
      expect(result.change).toBe(0);
      expect(result.direction).toBe('stable');
    });
  });

  describe('getImprovementMessage', () => {
    it('大幅改善で励ましメッセージを返す', () => {
      const msg = AdherenceTrendEntity.getImprovementMessage(20);
      expect(msg).toBe('大幅に改善しています。素晴らしいです');
    });

    it('小幅改善でメッセージを返す', () => {
      const msg = AdherenceTrendEntity.getImprovementMessage(8);
      expect(msg).toBe('少しずつ改善しています');
    });

    it('変化なしでメッセージを返す', () => {
      const msg = AdherenceTrendEntity.getImprovementMessage(0);
      expect(msg).toBe('現状を維持できています');
    });

    it('悪化でメッセージを返す', () => {
      const msg = AdherenceTrendEntity.getImprovementMessage(-10);
      expect(msg).toBe('少し服薬率が下がっています。一緒に頑張りましょう');
    });
  });

  describe('calculateConsistencyScore', () => {
    it('全て同じ値で100を返す', () => {
      expect(AdherenceTrendEntity.calculateConsistencyScore([80, 80, 80])).toBe(100);
    });

    it('ばらつきが大きい場合低いスコアを返す', () => {
      const score = AdherenceTrendEntity.calculateConsistencyScore([20, 80, 40, 90]);
      expect(score).toBeLessThan(50);
    });

    it('空配列で0を返す', () => {
      expect(AdherenceTrendEntity.calculateConsistencyScore([])).toBe(0);
    });

    it('1要素で100を返す', () => {
      expect(AdherenceTrendEntity.calculateConsistencyScore([75])).toBe(100);
    });

    it('スコアは0-100の範囲に収まる', () => {
      const score = AdherenceTrendEntity.calculateConsistencyScore([0, 100, 0, 100]);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });
});
