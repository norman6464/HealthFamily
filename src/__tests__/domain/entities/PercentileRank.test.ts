import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getPercentileRank', () => {
  it('空配列は0', () => {
    expect(MathHelper.getPercentileRank([], 5)).toBe(0);
  });

  it('最小値は0に近い', () => {
    const result = MathHelper.getPercentileRank([1, 2, 3, 4, 5], 1);
    expect(result).toBeLessThanOrEqual(20);
  });

  it('最大値は100に近い', () => {
    const result = MathHelper.getPercentileRank([1, 2, 3, 4, 5], 5);
    expect(result).toBeGreaterThanOrEqual(80);
  });

  it('中央値は50付近', () => {
    const result = MathHelper.getPercentileRank([1, 2, 3, 4, 5], 3);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(70);
  });

  it('全て同じ値は0', () => {
    expect(MathHelper.getPercentileRank([5, 5, 5, 5], 5)).toBe(0);
  });

  it('値より小さい要素がない場合は0', () => {
    expect(MathHelper.getPercentileRank([10, 20, 30], 10)).toBe(0);
  });

  it('結果は0-100', () => {
    const result = MathHelper.getPercentileRank([1, 5, 10, 15, 20], 12);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MathHelper.getPercentileRank([2, 4, 6, 8, 10], 7);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('1要素で同じ値は0', () => {
    expect(MathHelper.getPercentileRank([5], 5)).toBe(0);
  });

  it('1要素で異なる値は0または100', () => {
    expect(MathHelper.getPercentileRank([5], 10)).toBe(100);
    expect(MathHelper.getPercentileRank([5], 1)).toBe(0);
  });

  it('値が分布外（上側）は100', () => {
    expect(MathHelper.getPercentileRank([1, 2, 3], 100)).toBe(100);
  });

  it('値が分布外（下側）は0', () => {
    expect(MathHelper.getPercentileRank([10, 20, 30], 1)).toBe(0);
  });
});

describe('MathHelper.getPercentileRankLabel', () => {
  it('75以上は上位', () => {
    expect(MathHelper.getPercentileRankLabel(80)).toBe('上位');
  });

  it('25以上は中位', () => {
    expect(MathHelper.getPercentileRankLabel(50)).toBe('中位');
  });

  it('25未満は下位', () => {
    expect(MathHelper.getPercentileRankLabel(10)).toBe('下位');
  });
});
