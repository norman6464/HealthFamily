import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getPowerMean', () => {
  it('空配列は0', () => {
    expect(MathHelper.getPowerMean([], 2)).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getPowerMean([5], 2)).toBe(5);
  });

  it('p=1は算術平均', () => {
    // [2, 4, 6] -> mean = 4
    expect(MathHelper.getPowerMean([2, 4, 6], 1)).toBe(4);
  });

  it('p=2は二乗平均', () => {
    // [3, 4] -> sqrt((9+16)/2) = sqrt(12.5) ≈ 3.54
    const result = MathHelper.getPowerMean([3, 4], 2);
    expect(result).toBeCloseTo(3.54, 1);
  });

  it('同じ値はその値', () => {
    expect(MathHelper.getPowerMean([5, 5, 5], 3)).toBe(5);
  });

  it('p=0は0を返す', () => {
    expect(MathHelper.getPowerMean([2, 4, 6], 0)).toBe(0);
  });

  it('結果は0以上(正値入力)', () => {
    const result = MathHelper.getPowerMean([1, 2, 3], 2);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('pが大きいほど大きい値に近づく', () => {
    const p1 = MathHelper.getPowerMean([1, 10], 1);
    const p2 = MathHelper.getPowerMean([1, 10], 2);
    expect(p2).toBeGreaterThanOrEqual(p1);
  });

  it('全て0は0', () => {
    expect(MathHelper.getPowerMean([0, 0, 0], 2)).toBe(0);
  });
});

describe('MathHelper.getPowerMeanLabel', () => {
  it('小さい値は低い', () => {
    expect(MathHelper.getPowerMeanLabel(20)).toBe('低い');
  });

  it('中程度は中程度', () => {
    expect(MathHelper.getPowerMeanLabel(50)).toBe('中程度');
  });

  it('大きい値は高い', () => {
    expect(MathHelper.getPowerMeanLabel(80)).toBe('高い');
  });
});
