import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getSimpleLinearRegression', () => {
  it('空配列は傾き0・切片0', () => {
    const result = MathHelper.getSimpleLinearRegression([]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
  });

  it('1件は傾き0', () => {
    const result = MathHelper.getSimpleLinearRegression([5]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(5);
  });

  it('上昇傾向', () => {
    const result = MathHelper.getSimpleLinearRegression([1, 2, 3, 4, 5]);
    expect(result.slope).toBe(1);
  });

  it('下降傾向', () => {
    const result = MathHelper.getSimpleLinearRegression([5, 4, 3, 2, 1]);
    expect(result.slope).toBe(-1);
  });

  it('横ばい', () => {
    const result = MathHelper.getSimpleLinearRegression([3, 3, 3]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(3);
  });

  it('2件', () => {
    const result = MathHelper.getSimpleLinearRegression([0, 10]);
    expect(result.slope).toBe(10);
    expect(result.intercept).toBe(0);
  });

  it('傾きの正負で傾向がわかる', () => {
    const up = MathHelper.getSimpleLinearRegression([1, 3, 5, 7]);
    const down = MathHelper.getSimpleLinearRegression([7, 5, 3, 1]);
    expect(up.slope).toBeGreaterThan(0);
    expect(down.slope).toBeLessThan(0);
  });

  it('結果は数値', () => {
    const result = MathHelper.getSimpleLinearRegression([10, 20, 15, 25]);
    expect(typeof result.slope).toBe('number');
    expect(typeof result.intercept).toBe('number');
  });
});

describe('MathHelper.getSimpleLinearRegressionLabel', () => {
  it('正の傾きは上昇', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(2)).toBe('上昇');
  });

  it('負の傾きは下降', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(-2)).toBe('下降');
  });

  it('0付近は横ばい', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(0)).toBe('横ばい');
  });

  it('微小な正の傾きは横ばい', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(0.05)).toBe('横ばい');
  });
});
