import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMovingCorrelation', () => {
  it('空配列は空配列', () => {
    expect(MathHelper.getMovingCorrelation([], [], 3)).toEqual([]);
  });

  it('ウィンドウより短い配列は空', () => {
    expect(MathHelper.getMovingCorrelation([1, 2], [3, 4], 3)).toEqual([]);
  });

  it('配列長不一致は空', () => {
    expect(MathHelper.getMovingCorrelation([1, 2, 3], [1, 2], 2)).toEqual([]);
  });

  it('完全正相関は1に近い', () => {
    const result = MathHelper.getMovingCorrelation([1, 2, 3, 4, 5], [2, 4, 6, 8, 10], 3);
    expect(result.length).toBe(3);
    result.forEach((r) => expect(r).toBeCloseTo(1, 1));
  });

  it('完全負相関は-1に近い', () => {
    const result = MathHelper.getMovingCorrelation([1, 2, 3, 4, 5], [10, 8, 6, 4, 2], 3);
    expect(result.length).toBe(3);
    result.forEach((r) => expect(r).toBeCloseTo(-1, 1));
  });

  it('無相関は0に近い', () => {
    const result = MathHelper.getMovingCorrelation([1, 2, 3], [3, 1, 2], 3);
    expect(result.length).toBe(1);
    expect(Math.abs(result[0])).toBeLessThan(0.8);
  });

  it('ウィンドウサイズと同じ長さは1要素', () => {
    const result = MathHelper.getMovingCorrelation([1, 2, 3], [2, 4, 6], 3);
    expect(result.length).toBe(1);
  });

  it('結果は-1から1の範囲', () => {
    const result = MathHelper.getMovingCorrelation([5, 3, 8, 1, 9, 2], [2, 7, 1, 8, 3, 6], 3);
    result.forEach((r) => {
      expect(r).toBeGreaterThanOrEqual(-1);
      expect(r).toBeLessThanOrEqual(1);
    });
  });

  it('ウィンドウ0以下は空', () => {
    expect(MathHelper.getMovingCorrelation([1, 2, 3], [4, 5, 6], 0)).toEqual([]);
  });

  it('定数系列は0', () => {
    const result = MathHelper.getMovingCorrelation([5, 5, 5, 5], [1, 2, 3, 4], 3);
    result.forEach((r) => expect(r).toBe(0));
  });

  it('小数第2位まで丸められる', () => {
    const result = MathHelper.getMovingCorrelation([1, 3, 2, 5, 4], [2, 4, 1, 6, 3], 3);
    result.forEach((r) => {
      const str = r.toString();
      const decimals = str.split('.')[1];
      expect(!decimals || decimals.length <= 2).toBe(true);
    });
  });
});

describe('MathHelper.getMovingCorrelationLabel', () => {
  it('0.6以上は強い正相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(0.8)).toBe('強い正相関');
  });

  it('0.3以上はやや正相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(0.4)).toBe('やや正相関');
  });

  it('-0.3以上は無相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(0.1)).toBe('無相関');
  });

  it('-0.6以上はやや負相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(-0.5)).toBe('やや負相関');
  });

  it('-0.6未満は強い負相関', () => {
    expect(MathHelper.getMovingCorrelationLabel(-0.8)).toBe('強い負相関');
  });
});
