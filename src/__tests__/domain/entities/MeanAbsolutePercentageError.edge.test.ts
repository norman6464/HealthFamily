import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMeanAbsolutePercentageError エッジケース', () => {
  it('全て0の実測値は0', () => {
    expect(MathHelper.getMeanAbsolutePercentageError([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it('負の実測値でも計算可能', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([-10, -20], [-15, -25]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('非常に大きな値', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([1000000], [1000001]);
    expect(result).toBeLessThan(1);
  });

  it('小数値', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([0.1, 0.2], [0.15, 0.25]);
    expect(result).toBeGreaterThan(0);
  });

  it('予測が0で実測が非ゼロ', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([10], [0]);
    expect(result).toBe(100);
  });

  it('部分的に実測が0', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([0, 10, 0, 20], [5, 10, 5, 20]);
    expect(result).toBe(0);
  });

  it('多数の要素', () => {
    const actual = Array.from({ length: 100 }, (_, i) => i + 1);
    const predicted = actual.map((v) => v * 1.1);
    const result = MathHelper.getMeanAbsolutePercentageError(actual, predicted);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(20);
  });

  it('予測が半分なら50', () => {
    expect(MathHelper.getMeanAbsolutePercentageError([100], [50])).toBe(50);
  });

  it('予測がゼロで実測もゼロは0', () => {
    expect(MathHelper.getMeanAbsolutePercentageError([0], [0])).toBe(0);
  });

  it('結果は数値', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([5, 10], [6, 9]);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('実測と予測が逆でも正の値', () => {
    const result = MathHelper.getMeanAbsolutePercentageError([10, 20], [20, 10]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getMeanAbsolutePercentageErrorLabel エッジケース', () => {
  it('境界値10は精度高', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(10)).toBe('精度高');
  });

  it('境界値25はやや誤差', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(25)).toBe('やや誤差');
  });

  it('境界値10.01はやや誤差', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(10.01)).toBe('やや誤差');
  });

  it('境界値25.01は誤差大', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(25.01)).toBe('誤差大');
  });

  it('0は精度高', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(0)).toBe('精度高');
  });

  it('100は誤差大', () => {
    expect(MathHelper.getMeanAbsolutePercentageErrorLabel(100)).toBe('誤差大');
  });
});
