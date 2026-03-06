import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Weighted Average', () => {
  describe('getWeightedAverage', () => {
    it('均等な重みは通常の平均と同じ', () => {
      const values = [10, 20, 30];
      const weights = [1, 1, 1];
      expect(MathHelper.getWeightedAverage(values, weights)).toBe(20);
    });

    it('重みが異なる場合', () => {
      const values = [10, 20];
      const weights = [3, 1];
      expect(MathHelper.getWeightedAverage(values, weights)).toBe(12.5);
    });

    it('空配列は0', () => {
      expect(MathHelper.getWeightedAverage([], [])).toBe(0);
    });

    it('重みが全て0は0', () => {
      expect(MathHelper.getWeightedAverage([10, 20], [0, 0])).toBe(0);
    });

    it('1件のみ', () => {
      expect(MathHelper.getWeightedAverage([50], [1])).toBe(50);
    });

    it('配列長が異なる場合は短い方に合わせる', () => {
      expect(MathHelper.getWeightedAverage([10, 20, 30], [1, 1])).toBe(15);
    });
  });

  describe('getWeightedAverageLabel', () => {
    it('90以上は非常に高い', () => {
      expect(MathHelper.getWeightedAverageLabel(90)).toBe('非常に高い');
    });

    it('70以上は高い', () => {
      expect(MathHelper.getWeightedAverageLabel(70)).toBe('高い');
    });

    it('40以上は普通', () => {
      expect(MathHelper.getWeightedAverageLabel(40)).toBe('普通');
    });

    it('40未満は低い', () => {
      expect(MathHelper.getWeightedAverageLabel(39)).toBe('低い');
    });
  });
});
