import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getSpearmanRankCorrelation', () => {
  it('空配列は0', () => {
    expect(MathHelper.getSpearmanRankCorrelation([], [])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getSpearmanRankCorrelation([1], [1])).toBe(0);
  });

  it('完全正相関は1', () => {
    expect(MathHelper.getSpearmanRankCorrelation([1, 2, 3, 4, 5], [10, 20, 30, 40, 50])).toBe(1);
  });

  it('完全逆相関は-1', () => {
    expect(MathHelper.getSpearmanRankCorrelation([1, 2, 3, 4, 5], [50, 40, 30, 20, 10])).toBe(-1);
  });

  it('無相関は0付近', () => {
    const result = MathHelper.getSpearmanRankCorrelation([1, 2, 3, 4], [3, 1, 4, 2]);
    expect(Math.abs(result)).toBeLessThan(0.5);
  });

  it('配列長が異なる場合は短い方に合わせる', () => {
    const result = MathHelper.getSpearmanRankCorrelation([1, 2, 3], [1, 2, 3, 4, 5]);
    expect(result).toBe(1);
  });

  it('結果は-1から1の範囲', () => {
    const result = MathHelper.getSpearmanRankCorrelation([5, 3, 1, 2, 4], [2, 4, 5, 1, 3]);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });

  it('同順位でも計算できる', () => {
    const result = MathHelper.getSpearmanRankCorrelation([1, 1, 2, 3], [1, 2, 3, 4]);
    expect(typeof result).toBe('number');
  });
});

describe('MathHelper.getSpearmanRankCorrelationLabel', () => {
  it('正の強い相関は正相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(0.8)).toBe('正相関');
  });

  it('負の強い相関は逆相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(-0.8)).toBe('逆相関');
  });

  it('弱い相関は無相関', () => {
    expect(MathHelper.getSpearmanRankCorrelationLabel(0.2)).toBe('無相関');
  });
});
