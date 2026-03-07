import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getGiniCoefficient エッジケース', () => {
  it('2要素で同じ値は0', () => {
    expect(MathHelper.getGiniCoefficient([50, 50])).toBe(0);
  });

  it('2要素で片方0', () => {
    const result = MathHelper.getGiniCoefficient([0, 100]);
    expect(result).toBeGreaterThan(0.4);
  });

  it('非常に小さい値', () => {
    const result = MathHelper.getGiniCoefficient([0.001, 0.002, 0.003]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('非常に大きい値', () => {
    const result = MathHelper.getGiniCoefficient([1000000, 1000000, 1000000]);
    expect(result).toBe(0);
  });

  it('負の値を含む場合', () => {
    const result = MathHelper.getGiniCoefficient([-5, 10, 20]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('多数の要素で均等', () => {
    const values = Array.from({ length: 100 }, () => 10);
    expect(MathHelper.getGiniCoefficient(values)).toBe(0);
  });

  it('多数の要素で不均等', () => {
    const values = Array.from({ length: 99 }, () => 1);
    values.push(1000);
    const result = MathHelper.getGiniCoefficient(values);
    expect(result).toBeGreaterThan(0.5);
  });

  it('小数点以下の精度', () => {
    const result = MathHelper.getGiniCoefficient([1, 2, 3]);
    const str = result.toString();
    const decimals = str.split('.')[1];
    expect(!decimals || decimals.length <= 2).toBe(true);
  });

  it('1つだけ異なる値', () => {
    const result = MathHelper.getGiniCoefficient([10, 10, 10, 100]);
    expect(result).toBeGreaterThan(0.3);
  });

  it('降順でも同じ結果', () => {
    const asc = MathHelper.getGiniCoefficient([1, 5, 10]);
    const desc = MathHelper.getGiniCoefficient([10, 5, 1]);
    expect(asc).toBe(desc);
  });

  it('3要素で全て0は0', () => {
    expect(MathHelper.getGiniCoefficient([0, 0, 0])).toBe(0);
  });

  it('2要素で極端な差でも最大0.5', () => {
    const result = MathHelper.getGiniCoefficient([1, 10000]);
    expect(result).toBe(0.5);
  });
});

describe('MathHelper.getGiniCoefficientLabel エッジケース', () => {
  it('境界値0.2は均等', () => {
    expect(MathHelper.getGiniCoefficientLabel(0.2)).toBe('均等');
  });

  it('境界値0.21はやや偏り', () => {
    expect(MathHelper.getGiniCoefficientLabel(0.21)).toBe('やや偏り');
  });

  it('境界値0.5はやや偏り', () => {
    expect(MathHelper.getGiniCoefficientLabel(0.5)).toBe('やや偏り');
  });

  it('境界値0.51は偏り大', () => {
    expect(MathHelper.getGiniCoefficientLabel(0.51)).toBe('偏り大');
  });

  it('0は均等', () => {
    expect(MathHelper.getGiniCoefficientLabel(0)).toBe('均等');
  });

  it('1は偏り大', () => {
    expect(MathHelper.getGiniCoefficientLabel(1)).toBe('偏り大');
  });
});
