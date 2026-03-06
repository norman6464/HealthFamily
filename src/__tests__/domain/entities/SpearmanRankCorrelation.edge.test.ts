import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getSpearmanRankCorrelation - エッジケース', () => {
  it('両方空は0', () => {
    expect(MathHelper.getSpearmanRankCorrelation([], [])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getSpearmanRankCorrelation([5], [10])).toBe(0);
  });

  it('2件で完全正相関は1', () => {
    expect(MathHelper.getSpearmanRankCorrelation([1, 2], [10, 20])).toBe(1);
  });

  it('2件で完全逆相関は-1', () => {
    expect(MathHelper.getSpearmanRankCorrelation([1, 2], [20, 10])).toBe(-1);
  });

  it('完全正相関', () => {
    expect(MathHelper.getSpearmanRankCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBe(1);
  });

  it('完全逆相関', () => {
    expect(MathHelper.getSpearmanRankCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2])).toBe(-1);
  });

  it('配列長が異なる場合', () => {
    const result = MathHelper.getSpearmanRankCorrelation([1, 2, 3], [10, 20]);
    expect(result).toBe(1);
  });

  it('全て同値', () => {
    const result = MathHelper.getSpearmanRankCorrelation([5, 5, 5], [10, 10, 10]);
    expect(typeof result).toBe('number');
  });

  it('結果は-1から1の範囲', () => {
    const result = MathHelper.getSpearmanRankCorrelation([3, 1, 4, 1, 5], [9, 2, 6, 5, 3]);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('大量データ', () => {
    const x = Array.from({ length: 50 }, (_, i) => i);
    const y = Array.from({ length: 50 }, (_, i) => i * 2);
    expect(MathHelper.getSpearmanRankCorrelation(x, y)).toBe(1);
  });

  it('対称性', () => {
    const ab = MathHelper.getSpearmanRankCorrelation([1, 2, 3], [3, 1, 2]);
    const ba = MathHelper.getSpearmanRankCorrelation([3, 1, 2], [1, 2, 3]);
    expect(ab).toBe(ba);
  });
});

describe('MathHelper.getSpearmanRankCorrelationLabel - エッジケース', () => {
  it('1は正相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(1)).toBe('正相関');
  });

  it('0.6は正相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(0.6)).toBe('正相関');
  });

  it('0.59は無相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(0.59)).toBe('無相関');
  });

  it('0は無相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(0)).toBe('無相関');
  });

  it('-0.59は無相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(-0.59)).toBe('無相関');
  });

  it('-0.6は逆相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(-0.6)).toBe('逆相関');
  });

  it('-1は逆相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(-1)).toBe('逆相関');
  });
});
