import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMovingCorrelation エッジケース', () => {
  it('ウィンドウ1は空', () => {
    const result = MathHelper.getMovingCorrelation([1, 2, 3], [4, 5, 6], 1);
    result.forEach((r) => expect(r).toBe(0));
  });

  it('ウィンドウが配列長と同じ', () => {
    const result = MathHelper.getMovingCorrelation([1, 2, 3, 4], [2, 4, 6, 8], 4);
    expect(result.length).toBe(1);
    expect(result[0]).toBeCloseTo(1, 1);
  });

  it('両方定数は0', () => {
    const result = MathHelper.getMovingCorrelation([5, 5, 5], [3, 3, 3], 3);
    expect(result).toEqual([0]);
  });

  it('負のウィンドウは空', () => {
    expect(MathHelper.getMovingCorrelation([1, 2], [3, 4], -1)).toEqual([]);
  });

  it('非常に大きな値', () => {
    const result = MathHelper.getMovingCorrelation(
      [1000000, 2000000, 3000000],
      [3000000, 2000000, 1000000],
      3,
    );
    expect(result[0]).toBeCloseTo(-1, 1);
  });

  it('小数値', () => {
    const result = MathHelper.getMovingCorrelation(
      [0.1, 0.2, 0.3],
      [0.3, 0.6, 0.9],
      3,
    );
    expect(result[0]).toBeCloseTo(1, 1);
  });

  it('多数の要素', () => {
    const xs = Array.from({ length: 100 }, (_, i) => i);
    const ys = xs.map((x) => x * 2);
    const result = MathHelper.getMovingCorrelation(xs, ys, 10);
    expect(result.length).toBe(91);
    result.forEach((r) => expect(r).toBeCloseTo(1, 1));
  });

  it('結果は-1から1の範囲', () => {
    const result = MathHelper.getMovingCorrelation(
      [10, 1, 8, 3, 7, 2, 9],
      [2, 9, 3, 8, 1, 7, 4],
      3,
    );
    result.forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(-1);
      expect(r).toBeLessThanOrEqual(1);
    });
  });

  it('一方が0の系列', () => {
    const result = MathHelper.getMovingCorrelation([0, 0, 0], [1, 2, 3], 3);
    expect(result[0]).toBe(0);
  });

  it('交互パターン', () => {
    const result = MathHelper.getMovingCorrelation(
      [1, -1, 1, -1, 1],
      [-1, 1, -1, 1, -1],
      3,
    );
    result.forEach((r) => expect(r).toBeCloseTo(-1, 1));
  });

  it('ウィンドウ2で3要素は2つの結果', () => {
    const result = MathHelper.getMovingCorrelation([1, 2, 3], [2, 4, 6], 2);
    expect(result.length).toBe(2);
  });

  it('負の値を含む', () => {
    const result = MathHelper.getMovingCorrelation([-3, -1, 1, 3], [-6, -2, 2, 6], 3);
    result.forEach((r) => expect(r).toBeCloseTo(1, 1));
  });
});

describe('MathHelper.getMovingCorrelationLabel エッジケース', () => {
  it('境界値0.6は強い正相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(0.6)).toBe('強い正相関');
  });

  it('境界値0.3はやや正相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(0.3)).toBe('やや正相関');
  });

  it('境界値0.29は無相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(0.29)).toBe('無相関');
  });

  it('境界値-0.3は無相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(-0.3)).toBe('無相関');
  });

  it('境界値-0.31はやや負相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(-0.31)).toBe('やや負相関');
  });

  it('境界値-0.6はやや負相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(-0.6)).toBe('やや負相関');
  });

  it('境界値-0.61は強い負相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(-0.61)).toBe('強い負相関');
  });

  it('1は強い正相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(1)).toBe('強い正相関');
  });

  it('-1は強い負相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(-1)).toBe('強い負相関');
  });
});
