import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getHarmonicMean - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getHarmonicMean([])).toBe(0);
  });

  it('1要素はその値を返す', () => {
    expect(MathHelper.getHarmonicMean([5])).toBe(5);
  });

  it('全て同じ値ならその値を返す', () => {
    expect(MathHelper.getHarmonicMean([10, 10, 10])).toBe(10);
  });

  it('0を含む場合は0を返す', () => {
    expect(MathHelper.getHarmonicMean([0, 5, 10])).toBe(0);
  });

  it('負の値を含む場合は0を返す', () => {
    expect(MathHelper.getHarmonicMean([-1, 5, 10])).toBe(0);
  });

  it('調和平均は算術平均以下になる', () => {
    const values = [2, 8];
    const harmonic = MathHelper.getHarmonicMean(values);
    const arithmetic = MathHelper.calculateAverage(values);
    expect(harmonic).toBeLessThanOrEqual(arithmetic);
  });

  it('極端に異なる値の場合小さい方に寄る', () => {
    const values = [1, 1000];
    const harmonic = MathHelper.getHarmonicMean(values);
    expect(harmonic).toBeLessThan(10);
  });

  it('非常に大きな値の配列', () => {
    const values = [1000000, 2000000, 3000000];
    const result = MathHelper.getHarmonicMean(values);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(3000000);
  });

  it('非常に小さな正の値は丸めにより0になる', () => {
    const values = [0.001, 0.002, 0.003];
    const result = MathHelper.getHarmonicMean(values);
    // 小数点2桁丸めにより0になる
    expect(result).toBe(0);
  });

  it('小数点以下2桁に丸められる', () => {
    const values = [3, 7];
    const result = MathHelper.getHarmonicMean(values);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  it('2と3の調和平均は2.4', () => {
    // H = 2 / (1/2 + 1/3) = 2 / (5/6) = 12/5 = 2.4
    expect(MathHelper.getHarmonicMean([2, 3])).toBe(2.4);
  });

  it('1要素の大きな配列', () => {
    const values = Array(100).fill(50);
    expect(MathHelper.getHarmonicMean(values)).toBe(50);
  });
});

describe('MathHelper.getHarmonicMeanLabel - 境界値', () => {
  it('値70は高い(境界値)', () => {
    expect(MathHelper.getHarmonicMeanLabel(70)).toBe('高い');
  });

  it('値69は中程度', () => {
    expect(MathHelper.getHarmonicMeanLabel(69)).toBe('中程度');
  });

  it('値30は中程度(境界値)', () => {
    expect(MathHelper.getHarmonicMeanLabel(30)).toBe('中程度');
  });

  it('値29は低い', () => {
    expect(MathHelper.getHarmonicMeanLabel(29)).toBe('低い');
  });

  it('値0は低い', () => {
    expect(MathHelper.getHarmonicMeanLabel(0)).toBe('低い');
  });

  it('値100は高い', () => {
    expect(MathHelper.getHarmonicMeanLabel(100)).toBe('高い');
  });
});
