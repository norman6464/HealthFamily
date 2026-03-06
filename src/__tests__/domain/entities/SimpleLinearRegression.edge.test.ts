import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getSimpleLinearRegression - エッジケース', () => {
  it('空配列は傾き0・切片0', () => {
    const result = MathHelper.getSimpleLinearRegression([]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
  });

  it('1件は傾き0・切片が値', () => {
    const result = MathHelper.getSimpleLinearRegression([42]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(42);
  });

  it('2件で上昇', () => {
    const result = MathHelper.getSimpleLinearRegression([0, 10]);
    expect(result.slope).toBe(10);
    expect(result.intercept).toBe(0);
  });

  it('2件で下降', () => {
    const result = MathHelper.getSimpleLinearRegression([10, 0]);
    expect(result.slope).toBe(-10);
    expect(result.intercept).toBe(10);
  });

  it('全て同じは傾き0', () => {
    const result = MathHelper.getSimpleLinearRegression([5, 5, 5, 5]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(5);
  });

  it('完全な線形増加', () => {
    const result = MathHelper.getSimpleLinearRegression([0, 2, 4, 6, 8]);
    expect(result.slope).toBe(2);
    expect(result.intercept).toBe(0);
  });

  it('完全な線形減少', () => {
    const result = MathHelper.getSimpleLinearRegression([8, 6, 4, 2, 0]);
    expect(result.slope).toBe(-2);
    expect(result.intercept).toBe(8);
  });

  it('ノイズがある場合', () => {
    const result = MathHelper.getSimpleLinearRegression([1, 3, 2, 4, 3, 5]);
    expect(result.slope).toBeGreaterThan(0);
  });

  it('全て0は傾き0・切片0', () => {
    const result = MathHelper.getSimpleLinearRegression([0, 0, 0]);
    expect(result.slope).toBe(0);
    expect(result.intercept).toBe(0);
  });

  it('負の値', () => {
    const result = MathHelper.getSimpleLinearRegression([-10, -5, 0, 5, 10]);
    expect(result.slope).toBe(5);
    expect(result.intercept).toBe(-10);
  });

  it('大量データ', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const result = MathHelper.getSimpleLinearRegression(data);
    expect(result.slope).toBe(1);
  });

  it('小数値', () => {
    const result = MathHelper.getSimpleLinearRegression([0.5, 1.0, 1.5]);
    expect(result.slope).toBeCloseTo(0.5, 1);
  });
});

describe('MathHelper.getSimpleLinearRegressionLabel - エッジケース', () => {
  it('傾き1は上昇', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(1)).toBe('上昇');
  });

  it('傾き0.11は上昇', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(0.11)).toBe('上昇');
  });

  it('傾き0.1は横ばい', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(0.1)).toBe('横ばい');
  });

  it('傾き0は横ばい', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(0)).toBe('横ばい');
  });

  it('傾き-0.1は横ばい', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(-0.1)).toBe('横ばい');
  });

  it('傾き-0.11は下降', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(-0.11)).toBe('下降');
  });

  it('傾き-5は下降', () => {
    expect(MathHelper.getSimpleLinearRegressionLabel(-5)).toBe('下降');
  });
});
