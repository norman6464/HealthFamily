import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getWeightedHarmonicMean - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([], [])).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getWeightedHarmonicMean([42], [1])).toBe(42);
  });

  it('1件・重み大はその値', () => {
    expect(MathHelper.getWeightedHarmonicMean([42], [100])).toBe(42);
  });

  it('同値は重みに関わらず同じ', () => {
    expect(MathHelper.getWeightedHarmonicMean([10, 10, 10], [1, 2, 3])).toBe(10);
  });

  it('0を含む値は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([0, 10], [1, 1])).toBe(0);
  });

  it('負の値は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([-5, 10], [1, 1])).toBe(0);
  });

  it('配列長不一致は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([10, 20, 30], [1, 2])).toBe(0);
  });

  it('重み合計0は0', () => {
    expect(MathHelper.getWeightedHarmonicMean([10, 20], [0, 0])).toBe(0);
  });

  it('等重みは通常の調和平均', () => {
    const weighted = MathHelper.getWeightedHarmonicMean([40, 60], [1, 1]);
    const harmonic = MathHelper.getHarmonicMean([40, 60]);
    expect(weighted).toBe(harmonic);
  });

  it('重みで偏る', () => {
    const heavyFirst = MathHelper.getWeightedHarmonicMean([10, 100], [10, 1]);
    const heavySecond = MathHelper.getWeightedHarmonicMean([10, 100], [1, 10]);
    expect(heavyFirst).toBeLessThan(heavySecond);
  });

  it('大量データで均一', () => {
    const values = Array(50).fill(20);
    const weights = Array(50).fill(1);
    expect(MathHelper.getWeightedHarmonicMean(values, weights)).toBe(20);
  });

  it('結果は正の値', () => {
    const result = MathHelper.getWeightedHarmonicMean([5, 10, 15], [1, 2, 3]);
    expect(result).toBeGreaterThan(0);
  });

  it('算術平均以下', () => {
    const values = [2, 8];
    const result = MathHelper.getWeightedHarmonicMean(values, [1, 1]);
    const am = (2 + 8) / 2;
    expect(result).toBeLessThanOrEqual(am);
  });
});

describe('MathHelper.getWeightedHarmonicMeanLabel - エッジケース', () => {
  it('100は高い', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(100)).toBe('高い');
  });

  it('70は高い', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(70)).toBe('高い');
  });

  it('69は中程度', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(69)).toBe('中程度');
  });

  it('30は中程度', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(30)).toBe('中程度');
  });

  it('29は低い', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(29)).toBe('低い');
  });

  it('0は低い', () => {
    expect(MathHelper.getWeightedHarmonicMeanLabel(0)).toBe('低い');
  });
});
