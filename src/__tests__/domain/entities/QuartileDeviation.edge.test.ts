import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getQuartileDeviation エッジケース', () => {
  it('3件で均等', () => {
    expect(MathHelper.getQuartileDeviation([5, 5, 5])).toBe(0);
  });

  it('3件で異なる値', () => {
    const result = MathHelper.getQuartileDeviation([1, 5, 10]);
    expect(result).toBeGreaterThan(0);
  });

  it('非常に大きな値', () => {
    const result = MathHelper.getQuartileDeviation([1000000, 2000000, 3000000]);
    expect(result).toBeGreaterThan(0);
  });

  it('小数値', () => {
    const result = MathHelper.getQuartileDeviation([0.1, 0.2, 0.3, 0.4]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('負の値のみ', () => {
    const result = MathHelper.getQuartileDeviation([-10, -5, -3, -1]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('要素数が多い場合', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = MathHelper.getQuartileDeviation(values);
    expect(result).toBeGreaterThan(0);
  });

  it('全て同じ大きな値', () => {
    expect(MathHelper.getQuartileDeviation([999, 999, 999, 999])).toBe(0);
  });

  it('2件で同値は0', () => {
    expect(MathHelper.getQuartileDeviation([7, 7])).toBe(0);
  });

  it('外れ値がある場合', () => {
    const withoutOutlier = MathHelper.getQuartileDeviation([10, 11, 12, 13]);
    const withOutlier = MathHelper.getQuartileDeviation([10, 11, 12, 1000]);
    expect(withOutlier).toBeGreaterThan(withoutOutlier);
  });

  it('5件で正しく計算', () => {
    const result = MathHelper.getQuartileDeviation([2, 4, 6, 8, 10]);
    expect(result).toBeGreaterThan(0);
    expect(typeof result).toBe('number');
  });

  it('結果は数値', () => {
    const result = MathHelper.getQuartileDeviation([1, 3, 5, 7, 9, 11]);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('ソートされていない入力でも正しい', () => {
    const sorted = MathHelper.getQuartileDeviation([1, 2, 3, 4, 5]);
    const unsorted = MathHelper.getQuartileDeviation([3, 1, 5, 2, 4]);
    expect(sorted).toBe(unsorted);
  });
});

describe('MathHelper.getQuartileDeviationLabel エッジケース', () => {
  it('境界値5は均一', () => {
    expect(MathHelper.getQuartileDeviationLabel(5)).toBe('均一');
  });

  it('境界値20はやや散布', () => {
    expect(MathHelper.getQuartileDeviationLabel(20)).toBe('やや散布');
  });

  it('境界値5.01はやや散布', () => {
    expect(MathHelper.getQuartileDeviationLabel(5.01)).toBe('やや散布');
  });

  it('境界値20.01は散布', () => {
    expect(MathHelper.getQuartileDeviationLabel(20.01)).toBe('散布');
  });

  it('0は均一', () => {
    expect(MathHelper.getQuartileDeviationLabel(0)).toBe('均一');
  });

  it('100は散布', () => {
    expect(MathHelper.getQuartileDeviationLabel(100)).toBe('散布');
  });
});
