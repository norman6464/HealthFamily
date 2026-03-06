import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getZScore - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getZScore([], 0)).toBe(0);
  });

  it('1要素は0を返す', () => {
    expect(MathHelper.getZScore([100], 100)).toBe(0);
  });

  it('全て同じ値(stddev=0)は0を返す', () => {
    expect(MathHelper.getZScore([5, 5, 5, 5], 5)).toBe(0);
    expect(MathHelper.getZScore([5, 5, 5, 5], 10)).toBe(0);
  });

  it('対象値が平均と一致する場合0を返す', () => {
    expect(MathHelper.getZScore([1, 2, 3, 4, 5], 3)).toBe(0);
  });

  it('正のZ値を返す', () => {
    expect(MathHelper.getZScore([10, 20, 30], 30)).toBeGreaterThan(0);
  });

  it('負のZ値を返す', () => {
    expect(MathHelper.getZScore([10, 20, 30], 10)).toBeLessThan(0);
  });

  it('Z値の対称性: 平均からの距離が同じなら絶対値が同じ', () => {
    const values = [10, 20, 30];
    const zPlus = MathHelper.getZScore(values, 25);
    const zMinus = MathHelper.getZScore(values, 15);
    expect(Math.abs(zPlus)).toBe(Math.abs(zMinus));
  });

  it('大きな外れ値は高いZ値', () => {
    const z = MathHelper.getZScore([10, 11, 12, 13, 14], 100);
    expect(z).toBeGreaterThan(5);
  });

  it('負の値を含む配列', () => {
    const result = MathHelper.getZScore([-10, -5, 0, 5, 10], 0);
    expect(result).toBe(0);
  });

  it('小数点2桁に丸められる', () => {
    const result = MathHelper.getZScore([1, 2, 3, 4, 5], 4);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });

  it('100要素の大量データ', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const result = MathHelper.getZScore(values, 50);
    expect(result).toBeGreaterThan(-1);
    expect(result).toBeLessThan(1);
  });
});

describe('MathHelper.getZScoreLabel - 境界値', () => {
  it('Z値2は異常(境界値)', () => {
    expect(MathHelper.getZScoreLabel(2)).toBe('異常');
  });

  it('Z値1.99はやや外れ値', () => {
    expect(MathHelper.getZScoreLabel(1.99)).toBe('やや外れ値');
  });

  it('Z値1は正常/やや外れ値(境界値)', () => {
    expect(MathHelper.getZScoreLabel(1)).toBe('やや外れ値');
  });

  it('Z値0.99は正常', () => {
    expect(MathHelper.getZScoreLabel(0.99)).toBe('正常');
  });

  it('Z値-2は異常(境界値)', () => {
    expect(MathHelper.getZScoreLabel(-2)).toBe('異常');
  });

  it('Z値-1はやや外れ値(境界値)', () => {
    expect(MathHelper.getZScoreLabel(-1)).toBe('やや外れ値');
  });

  it('Z値0は正常', () => {
    expect(MathHelper.getZScoreLabel(0)).toBe('正常');
  });
});
