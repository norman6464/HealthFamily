import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getEntropyScore - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getEntropyScore([])).toBe(0);
  });

  it('1要素は0を返す', () => {
    expect(MathHelper.getEntropyScore([42])).toBe(0);
  });

  it('2つの同じ値は0を返す', () => {
    expect(MathHelper.getEntropyScore([5, 5])).toBe(0);
  });

  it('2つの異なる値で均等は100', () => {
    expect(MathHelper.getEntropyScore([1, 2])).toBe(100);
  });

  it('大量の同一値は0', () => {
    expect(MathHelper.getEntropyScore(Array(1000).fill(7))).toBe(0);
  });

  it('大量の全異なる値は100', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    expect(MathHelper.getEntropyScore(values)).toBe(100);
  });

  it('1つだけ異なる値を持つ大量データ', () => {
    const values = [...Array(99).fill(1), 2];
    const result = MathHelper.getEntropyScore(values);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });

  it('負の値も正しく処理する', () => {
    expect(MathHelper.getEntropyScore([-1, -2, -3])).toBe(100);
  });

  it('0を含む配列', () => {
    expect(MathHelper.getEntropyScore([0, 0, 1])).toBeGreaterThan(0);
  });

  it('小数値も正しく区別する', () => {
    expect(MathHelper.getEntropyScore([1.1, 1.2, 1.3])).toBe(100);
  });

  it('0-100の範囲内に収まる', () => {
    const result = MathHelper.getEntropyScore([1, 1, 1, 2, 2, 3]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('均等に3種類分布で100', () => {
    expect(MathHelper.getEntropyScore([1, 2, 3, 1, 2, 3, 1, 2, 3])).toBe(100);
  });

  it('1種類が支配的な場合でも0より大きい', () => {
    const values = [...Array(90).fill(1), ...Array(10).fill(2)];
    const result = MathHelper.getEntropyScore(values);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getEntropyLabel - 境界値', () => {
  it('スコア70は多様(境界値)', () => {
    expect(MathHelper.getEntropyLabel(70)).toBe('多様');
  });

  it('スコア69は普通', () => {
    expect(MathHelper.getEntropyLabel(69)).toBe('普通');
  });

  it('スコア30は普通(境界値)', () => {
    expect(MathHelper.getEntropyLabel(30)).toBe('普通');
  });

  it('スコア29は均一', () => {
    expect(MathHelper.getEntropyLabel(29)).toBe('均一');
  });

  it('スコア0は均一', () => {
    expect(MathHelper.getEntropyLabel(0)).toBe('均一');
  });

  it('スコア100は多様', () => {
    expect(MathHelper.getEntropyLabel(100)).toBe('多様');
  });
});
