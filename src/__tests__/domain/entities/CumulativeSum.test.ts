import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getCumulativeSum', () => {
  it('空配列は空配列を返す', () => {
    expect(MathHelper.getCumulativeSum([])).toEqual([]);
  });

  it('1要素はそのまま', () => {
    expect(MathHelper.getCumulativeSum([5])).toEqual([5]);
  });

  it('昇順の累積和', () => {
    expect(MathHelper.getCumulativeSum([1, 2, 3])).toEqual([1, 3, 6]);
  });

  it('全て同じ値', () => {
    expect(MathHelper.getCumulativeSum([10, 10, 10])).toEqual([10, 20, 30]);
  });

  it('全て0', () => {
    expect(MathHelper.getCumulativeSum([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('負の値も処理', () => {
    expect(MathHelper.getCumulativeSum([5, -3, 2])).toEqual([5, 2, 4]);
  });

  it('結果の長さは入力と同じ', () => {
    const result = MathHelper.getCumulativeSum([1, 2, 3, 4, 5]);
    expect(result).toHaveLength(5);
  });

  it('最後の要素は合計と一致', () => {
    const values = [10, 20, 30];
    const result = MathHelper.getCumulativeSum(values);
    expect(result[result.length - 1]).toBe(60);
  });
});

describe('MathHelper.getCumulativeSumLabel', () => {
  it('合計が目標以上は達成', () => {
    expect(MathHelper.getCumulativeSumLabel(100, 100)).toBe('達成');
  });

  it('合計が目標の70%以上はあと少し', () => {
    expect(MathHelper.getCumulativeSumLabel(75, 100)).toBe('あと少し');
  });

  it('合計が目標の70%未満は途中', () => {
    expect(MathHelper.getCumulativeSumLabel(50, 100)).toBe('途中');
  });
});
