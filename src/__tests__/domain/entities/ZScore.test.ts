import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getZScore', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getZScore([], 5)).toBe(0);
  });

  it('1要素は0を返す', () => {
    expect(MathHelper.getZScore([5], 5)).toBe(0);
  });

  it('全て同じ値でstddev=0の場合0を返す', () => {
    expect(MathHelper.getZScore([5, 5, 5], 5)).toBe(0);
  });

  it('平均値のZ値は0', () => {
    expect(MathHelper.getZScore([10, 20, 30], 20)).toBe(0);
  });

  it('平均+1stddevのZ値は1', () => {
    // [10,20,30], avg=20, stddev=8.16..., value=28.16... -> z=1
    const values = [10, 20, 30];
    const avg = 20;
    const stdDev = MathHelper.calculateStdDev(values);
    const result = MathHelper.getZScore(values, avg + stdDev);
    expect(result).toBe(1);
  });

  it('平均より大きい値は正のZ値', () => {
    expect(MathHelper.getZScore([10, 20, 30], 25)).toBeGreaterThan(0);
  });

  it('平均より小さい値は負のZ値', () => {
    expect(MathHelper.getZScore([10, 20, 30], 15)).toBeLessThan(0);
  });

  it('小数点2桁に丸められる', () => {
    const result = MathHelper.getZScore([10, 20, 30], 25);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(2);
  });
});

describe('MathHelper.getZScoreLabel', () => {
  it('Z値0は正常', () => {
    expect(MathHelper.getZScoreLabel(0)).toBe('正常');
  });

  it('Z値2以上は異常', () => {
    expect(MathHelper.getZScoreLabel(2)).toBe('異常');
  });

  it('Z値-2以下は異常', () => {
    expect(MathHelper.getZScoreLabel(-2)).toBe('異常');
  });

  it('Z値1.5はやや外れ値', () => {
    expect(MathHelper.getZScoreLabel(1.5)).toBe('やや外れ値');
  });

  it('Z値-1.5はやや外れ値', () => {
    expect(MathHelper.getZScoreLabel(-1.5)).toBe('やや外れ値');
  });
});
