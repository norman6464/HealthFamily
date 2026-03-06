import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRankPercentile - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getRankPercentile([], 5)).toBe(0);
  });

  it('1要素で対象値と一致は50', () => {
    expect(MathHelper.getRankPercentile([10], 10)).toBe(50);
  });

  it('対象値が全値より大きい場合100', () => {
    expect(MathHelper.getRankPercentile([1, 2, 3], 100)).toBe(100);
  });

  it('対象値が全値より小さい場合0', () => {
    expect(MathHelper.getRankPercentile([10, 20, 30], 1)).toBe(0);
  });

  it('全て同じ値で対象一致は50', () => {
    expect(MathHelper.getRankPercentile([5, 5, 5, 5], 5)).toBe(50);
  });

  it('重複値がある場合の正しい計算', () => {
    // [1,1,2,3,3], target=2: below=2, equal=1 -> (2+0.5)/5=50
    expect(MathHelper.getRankPercentile([1, 1, 2, 3, 3], 2)).toBe(50);
  });

  it('負の値を含む配列', () => {
    const result = MathHelper.getRankPercentile([-10, -5, 0, 5, 10], 0);
    expect(result).toBe(50);
  });

  it('大量データでの中央値', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = MathHelper.getRankPercentile(values, 50);
    expect(result).toBeGreaterThan(45);
    expect(result).toBeLessThan(55);
  });

  it('0-100の範囲内', () => {
    const result = MathHelper.getRankPercentile([1, 2, 3, 4, 5], 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('小数値も正しく処理', () => {
    const result = MathHelper.getRankPercentile([1.5, 2.5, 3.5], 2.5);
    expect(result).toBe(50);
  });
});

describe('MathHelper.getRankPercentileLabel - 境界値', () => {
  it('百分率80は上位(境界値)', () => {
    expect(MathHelper.getRankPercentileLabel(80)).toBe('上位');
  });

  it('百分率79は中位', () => {
    expect(MathHelper.getRankPercentileLabel(79)).toBe('中位');
  });

  it('百分率50は中位(境界値)', () => {
    expect(MathHelper.getRankPercentileLabel(50)).toBe('中位');
  });

  it('百分率49は下位', () => {
    expect(MathHelper.getRankPercentileLabel(49)).toBe('下位');
  });

  it('百分率0は下位', () => {
    expect(MathHelper.getRankPercentileLabel(0)).toBe('下位');
  });

  it('百分率100は上位', () => {
    expect(MathHelper.getRankPercentileLabel(100)).toBe('上位');
  });
});
