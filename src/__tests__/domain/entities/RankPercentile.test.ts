import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRankPercentile', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getRankPercentile([], 5)).toBe(0);
  });

  it('1要素で一致は50を返す(中央順位)', () => {
    expect(MathHelper.getRankPercentile([5], 5)).toBe(50);
  });

  it('最大値は90を返す(5要素中)', () => {
    expect(MathHelper.getRankPercentile([1, 2, 3, 4, 5], 5)).toBe(90);
  });

  it('最小値は低い順位を返す', () => {
    const result = MathHelper.getRankPercentile([1, 2, 3, 4, 5], 1);
    expect(result).toBeLessThanOrEqual(20);
  });

  it('中央値は約50', () => {
    const result = MathHelper.getRankPercentile([1, 2, 3, 4, 5], 3);
    expect(result).toBeGreaterThanOrEqual(40);
    expect(result).toBeLessThanOrEqual(60);
  });

  it('配列にない値(全より大きい)は100', () => {
    expect(MathHelper.getRankPercentile([1, 2, 3], 10)).toBe(100);
  });

  it('配列にない値(全より小さい)は0', () => {
    expect(MathHelper.getRankPercentile([10, 20, 30], 1)).toBe(0);
  });

  it('0-100の範囲内に収まる', () => {
    const result = MathHelper.getRankPercentile([5, 10, 15, 20], 12);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MathHelper.getRankPercentileLabel', () => {
  it('百分率80以上は上位', () => {
    expect(MathHelper.getRankPercentileLabel(80)).toBe('上位');
  });

  it('百分率50以上は中位', () => {
    expect(MathHelper.getRankPercentileLabel(50)).toBe('中位');
  });

  it('百分率50未満は下位', () => {
    expect(MathHelper.getRankPercentileLabel(30)).toBe('下位');
  });
});
