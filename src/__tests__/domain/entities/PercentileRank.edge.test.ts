import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getPercentileRank エッジケース', () => {
  it('2要素で小さい方は0', () => {
    expect(MathHelper.getPercentileRank([1, 10], 1)).toBe(0);
  });

  it('2要素で大きい方は50', () => {
    expect(MathHelper.getPercentileRank([1, 10], 10)).toBe(50);
  });

  it('2要素で中間値は50', () => {
    expect(MathHelper.getPercentileRank([1, 10], 5)).toBe(50);
  });

  it('全て同じ値でtargetが異なる場合', () => {
    expect(MathHelper.getPercentileRank([5, 5, 5], 10)).toBe(100);
    expect(MathHelper.getPercentileRank([5, 5, 5], 1)).toBe(0);
  });

  it('負の値を含む分布', () => {
    const result = MathHelper.getPercentileRank([-10, -5, 0, 5, 10], 0);
    expect(result).toBe(40);
  });

  it('多数の要素', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(MathHelper.getPercentileRank(values, 50)).toBe(49);
  });

  it('小数値', () => {
    const result = MathHelper.getPercentileRank([0.1, 0.5, 1.0], 0.5);
    expect(result).toBe(33);
  });

  it('非常に大きな値', () => {
    expect(MathHelper.getPercentileRank([1, 1000000], 500000)).toBe(50);
  });

  it('降順でも同じ結果', () => {
    const asc = MathHelper.getPercentileRank([1, 2, 3, 4, 5], 3);
    const desc = MathHelper.getPercentileRank([5, 4, 3, 2, 1], 3);
    expect(asc).toBe(desc);
  });

  it('結果は整数', () => {
    const result = MathHelper.getPercentileRank([1, 3, 5, 7, 9], 6);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('targetが最小値より小さい場合は0', () => {
    expect(MathHelper.getPercentileRank([10, 20, 30], 5)).toBe(0);
  });

  it('targetが最大値より大きい場合は100', () => {
    expect(MathHelper.getPercentileRank([10, 20, 30], 50)).toBe(100);
  });

  it('重複値がある場合', () => {
    const result = MathHelper.getPercentileRank([1, 1, 1, 5, 5, 5], 3);
    expect(result).toBe(50);
  });

  it('4要素でtargetが2番目と同じ', () => {
    expect(MathHelper.getPercentileRank([1, 3, 5, 7], 3)).toBe(25);
  });
});

describe('MathHelper.getPercentileRankLabel エッジケース', () => {
  it('境界値75は上位', () => {
    expect(MathHelper.getPercentileRankLabel(75)).toBe('上位');
  });

  it('境界値25は中位', () => {
    expect(MathHelper.getPercentileRankLabel(25)).toBe('中位');
  });

  it('境界値74は中位', () => {
    expect(MathHelper.getPercentileRankLabel(74)).toBe('中位');
  });

  it('境界値24は下位', () => {
    expect(MathHelper.getPercentileRankLabel(24)).toBe('下位');
  });

  it('0は下位', () => {
    expect(MathHelper.getPercentileRankLabel(0)).toBe('下位');
  });

  it('100は上位', () => {
    expect(MathHelper.getPercentileRankLabel(100)).toBe('上位');
  });
});
