import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getWeightedHarmonicMean', () => {
  it('空配列は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([], [])).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getWeightedHarmonicMean([10], [1])).toBe(10);
  });

  it('同値・同重みは同じ値', () => {
    expect(MathHelper.getWeightedHarmonicMean([5, 5, 5], [1, 1, 1])).toBe(5);
  });

  it('2件・等重みは調和平均', () => {
    // 等重みの調和平均: 2/(1/40 + 1/60) = 48
    expect(MathHelper.getWeightedHarmonicMean([40, 60], [1, 1])).toBe(48);
  });

  it('重みで加重される', () => {
    // 重み[3,1]で40と60: (3+1)/(3/40 + 1/60) = 4/(0.075+0.0167) = 4/0.0917 = 43.64
    const result = MathHelper.getWeightedHarmonicMean([40, 60], [3, 1]);
    expect(result).toBeGreaterThan(40);
    expect(result).toBeLessThan(48);
  });

  it('0を含む値は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([10, 0, 20], [1, 1, 1])).toBe(0);
  });

  it('配列長不一致は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([10, 20], [1])).toBe(0);
  });

  it('重み合計0は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([10, 20], [0, 0])).toBe(0);
  });

  it('負の値は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([-5, 10], [1, 1])).toBe(0);
  });

  it('結果は正の値', () => {
    const result = MathHelper.getWeightedHarmonicMean([3, 6, 9], [1, 2, 3]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getWeightedHarmonicMeanLabel', () => {
  it('高い値は高い', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(75)).toBe('高い');
  });

  it('中程度は中程度', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(50)).toBe('中程度');
  });

  it('低い値は低い', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(20)).toBe('低い');
  });
});
