import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getEntropyScore', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getEntropyScore([])).toBe(0);
  });

  it('1要素は0を返す(多様性なし)', () => {
    expect(MathHelper.getEntropyScore([5])).toBe(0);
  });

  it('全て同じ値は0を返す', () => {
    expect(MathHelper.getEntropyScore([3, 3, 3, 3])).toBe(0);
  });

  it('2種類の値が均等分布で高スコア', () => {
    const result = MathHelper.getEntropyScore([1, 2, 1, 2]);
    expect(result).toBe(100);
  });

  it('3種類の値が均等分布で100', () => {
    const result = MathHelper.getEntropyScore([1, 2, 3, 1, 2, 3]);
    expect(result).toBe(100);
  });

  it('偏った分布は均等分布より低スコア', () => {
    const biased = MathHelper.getEntropyScore([1, 1, 1, 1, 1, 2]);
    const uniform = MathHelper.getEntropyScore([1, 2, 1, 2, 1, 2]);
    expect(biased).toBeLessThan(uniform);
  });

  it('全て異なる値は100', () => {
    expect(MathHelper.getEntropyScore([1, 2, 3, 4, 5])).toBe(100);
  });

  it('0-100の範囲内に収まる', () => {
    const result = MathHelper.getEntropyScore([1, 1, 2, 3, 3, 3, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MathHelper.getEntropyLabel', () => {
  it('スコア70以上は多様', () => {
    expect(MathHelper.getEntropyLabel(70)).toBe('多様');
  });

  it('スコア30以上70未満は普通', () => {
    expect(MathHelper.getEntropyLabel(50)).toBe('普通');
  });

  it('スコア30未満は均一', () => {
    expect(MathHelper.getEntropyLabel(20)).toBe('均一');
  });
});
