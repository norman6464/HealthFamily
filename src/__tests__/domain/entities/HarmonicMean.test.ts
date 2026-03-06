import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('getHarmonicMean', () => {
  it('空配列の場合0を返す', () => {
    expect(MathHelper.getHarmonicMean([])).toBe(0);
  });

  it('1要素の場合その値を返す', () => {
    expect(MathHelper.getHarmonicMean([5])).toBe(5);
  });

  it('0を含む場合0を返す', () => {
    expect(MathHelper.getHarmonicMean([0, 5, 10])).toBe(0);
  });

  it('負の値を含む場合0を返す', () => {
    expect(MathHelper.getHarmonicMean([-1, 5, 10])).toBe(0);
  });

  it('全て同じ値の場合その値を返す', () => {
    expect(MathHelper.getHarmonicMean([4, 4, 4])).toBe(4);
  });

  it('[1, 2, 4]の調和平均を正しく計算する', () => {
    const result = MathHelper.getHarmonicMean([1, 2, 4]);
    expect(result).toBeCloseTo(1.71, 1);
  });

  it('[2, 3]の調和平均を正しく計算する', () => {
    const result = MathHelper.getHarmonicMean([2, 3]);
    expect(result).toBe(2.4);
  });
});

describe('getHarmonicMeanLabel', () => {
  it('70以上は高いを返す', () => {
    expect(MathHelper.getHarmonicMeanLabel(80)).toBe('高い');
  });

  it('30以上70未満は中程度を返す', () => {
    expect(MathHelper.getHarmonicMeanLabel(50)).toBe('中程度');
  });

  it('30未満は低いを返す', () => {
    expect(MathHelper.getHarmonicMeanLabel(10)).toBe('低い');
  });

  it('0は低いを返す', () => {
    expect(MathHelper.getHarmonicMeanLabel(0)).toBe('低い');
  });
});
