import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper - Weighted Average Edge Cases', () => {
  describe('getWeightedAverage', () => {
    it('負の値を含む', () => {
      expect(MathHelper.getWeightedAverage([-10, 20], [1, 1])).toBe(5);
    });

    it('非常に大きな重み', () => {
      expect(MathHelper.getWeightedAverage([100, 0], [1000, 1])).toBeCloseTo(99.9, 0);
    });

    it('小数の重み', () => {
      expect(MathHelper.getWeightedAverage([10, 20], [0.5, 0.5])).toBe(15);
    });
  });

  describe('getWeightedAverageLabel', () => {
    it('境界値90は非常に高い', () => {
      expect(MathHelper.getWeightedAverageLabel(90)).toBe('非常に高い');
    });

    it('境界値89は高い', () => {
      expect(MathHelper.getWeightedAverageLabel(89)).toBe('高い');
    });

    it('境界値70は高い', () => {
      expect(MathHelper.getWeightedAverageLabel(70)).toBe('高い');
    });

    it('境界値69は普通', () => {
      expect(MathHelper.getWeightedAverageLabel(69)).toBe('普通');
    });

    it('境界値40は普通', () => {
      expect(MathHelper.getWeightedAverageLabel(40)).toBe('普通');
    });

    it('境界値39は低い', () => {
      expect(MathHelper.getWeightedAverageLabel(39)).toBe('低い');
    });
  });
});
