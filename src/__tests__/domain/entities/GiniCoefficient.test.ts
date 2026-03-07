import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getGiniCoefficient', () => {
  it('空配列は0', () => {
    expect(MathHelper.getGiniCoefficient([])).toBe(0);
  });

  it('1要素は0', () => {
    expect(MathHelper.getGiniCoefficient([100])).toBe(0);
  });

  it('全て同じ値は0（完全平等）', () => {
    expect(MathHelper.getGiniCoefficient([10, 10, 10, 10])).toBe(0);
  });

  it('1つだけ正で他が0なら最大に近い', () => {
    const result = MathHelper.getGiniCoefficient([0, 0, 0, 100]);
    expect(result).toBeGreaterThan(0.7);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('2つの値で差が大きい場合', () => {
    const result = MathHelper.getGiniCoefficient([1, 99]);
    expect(result).toBeGreaterThan(0.4);
  });

  it('均等に近い分布は低い値', () => {
    const result = MathHelper.getGiniCoefficient([10, 11, 12, 13]);
    expect(result).toBeLessThan(0.1);
  });

  it('結果は0以上1以下', () => {
    const result = MathHelper.getGiniCoefficient([5, 10, 20, 50, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('小数第2位まで丸められる', () => {
    const result = MathHelper.getGiniCoefficient([1, 2, 3, 4, 5]);
    const decimals = result.toString().split('.')[1];
    expect(!decimals || decimals.length <= 2).toBe(true);
  });

  it('全て0は0', () => {
    expect(MathHelper.getGiniCoefficient([0, 0, 0])).toBe(0);
  });

  it('不均等な分布は高い値', () => {
    const result = MathHelper.getGiniCoefficient([1, 1, 1, 1, 100]);
    expect(result).toBeGreaterThan(0.5);
  });
});

describe('MathHelper.getGiniCoefficientLabel', () => {
  it('0.2以下は均等', () => {
    expect(MathHelper.getGiniCoefficientLabel(0.15)).toBe('均等');
  });

  it('0.5以下はやや偏り', () => {
    expect(MathHelper.getGiniCoefficientLabel(0.35)).toBe('やや偏り');
  });

  it('0.5超は偏り大', () => {
    expect(MathHelper.getGiniCoefficientLabel(0.7)).toBe('偏り大');
  });
});
