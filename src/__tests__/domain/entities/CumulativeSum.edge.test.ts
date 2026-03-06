import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getCumulativeSum - エッジケース', () => {
  it('空配列は空配列', () => {
    expect(MathHelper.getCumulativeSum([])).toEqual([]);
  });

  it('1要素はそのまま', () => {
    expect(MathHelper.getCumulativeSum([42])).toEqual([42]);
  });

  it('全て0', () => {
    expect(MathHelper.getCumulativeSum([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('全て1', () => {
    expect(MathHelper.getCumulativeSum([1, 1, 1, 1])).toEqual([1, 2, 3, 4]);
  });

  it('負の値のみ', () => {
    expect(MathHelper.getCumulativeSum([-1, -2, -3])).toEqual([-1, -3, -6]);
  });

  it('正と負の混合', () => {
    expect(MathHelper.getCumulativeSum([10, -5, 3, -2])).toEqual([10, 5, 8, 6]);
  });

  it('大きな値', () => {
    const result = MathHelper.getCumulativeSum([1000000, 2000000]);
    expect(result).toEqual([1000000, 3000000]);
  });

  it('小数値', () => {
    const result = MathHelper.getCumulativeSum([0.1, 0.2, 0.3]);
    expect(result[2]).toBeCloseTo(0.6);
  });

  it('結果は単調増加(全て正の場合)', () => {
    const result = MathHelper.getCumulativeSum([1, 2, 3, 4, 5]);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1]);
    }
  });

  it('最後の要素は総和', () => {
    const values = [5, 10, 15, 20, 25];
    const result = MathHelper.getCumulativeSum(values);
    expect(result[result.length - 1]).toBe(75);
  });

  it('大量データ', () => {
    const data = Array.from({ length: 100 }, () => 1);
    const result = MathHelper.getCumulativeSum(data);
    expect(result).toHaveLength(100);
    expect(result[99]).toBe(100);
  });

  it('結果の長さは入力と同じ', () => {
    const result = MathHelper.getCumulativeSum([1, 2, 3]);
    expect(result).toHaveLength(3);
  });

  it('2要素', () => {
    expect(MathHelper.getCumulativeSum([3, 7])).toEqual([3, 10]);
  });
});

describe('MathHelper.getCumulativeSumLabel - 境界値', () => {
  it('合計が目標以上は達成', () => {
    expect(MathHelper.getCumulativeSumLabel(100, 100)).toBe('達成');
  });

  it('合計が目標を超過しても達成', () => {
    expect(MathHelper.getCumulativeSumLabel(150, 100)).toBe('達成');
  });

  it('合計が目標の70%ちょうどはあと少し', () => {
    expect(MathHelper.getCumulativeSumLabel(70, 100)).toBe('あと少し');
  });

  it('合計が目標の69%は途中', () => {
    expect(MathHelper.getCumulativeSumLabel(69, 100)).toBe('途中');
  });

  it('合計0で目標0は達成', () => {
    expect(MathHelper.getCumulativeSumLabel(0, 0)).toBe('達成');
  });

  it('目標が負の場合は達成', () => {
    expect(MathHelper.getCumulativeSumLabel(0, -10)).toBe('達成');
  });
});
