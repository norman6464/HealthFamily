import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRootMeanSquare', () => {
  it('空配列は0', () => {
    expect(MathHelper.getRootMeanSquare([])).toBe(0);
  });

  it('1件はその値の絶対値', () => {
    expect(MathHelper.getRootMeanSquare([5])).toBe(5);
  });

  it('全て0は0', () => {
    expect(MathHelper.getRootMeanSquare([0, 0, 0])).toBe(0);
  });

  it('同じ値はその値', () => {
    expect(MathHelper.getRootMeanSquare([3, 3, 3])).toBe(3);
  });

  it('正の値の配列', () => {
    // [1, 2, 3] -> sqrt((1+4+9)/3) = sqrt(14/3) = sqrt(4.667) ≈ 2.16
    const result = MathHelper.getRootMeanSquare([1, 2, 3]);
    expect(result).toBeCloseTo(2.16, 1);
  });

  it('負の値を含む', () => {
    // [-3, 3] -> sqrt((9+9)/2) = sqrt(9) = 3
    expect(MathHelper.getRootMeanSquare([-3, 3])).toBe(3);
  });

  it('RMSは常に平均以上', () => {
    const values = [1, 2, 3, 4, 5];
    const rms = MathHelper.getRootMeanSquare(values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    expect(rms).toBeGreaterThanOrEqual(avg);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getRootMeanSquare([-5, -3, -1]);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('MathHelper.getRootMeanSquareLabel', () => {
  it('RMSが小さいは低い', () => {
    expect(MathHelper.getRootMeanSquareLabel(20)).toBe('低い');
  });

  it('RMSが中程度は中程度', () => {
    expect(MathHelper.getRootMeanSquareLabel(50)).toBe('中程度');
  });

  it('RMSが大きいは高い', () => {
    expect(MathHelper.getRootMeanSquareLabel(80)).toBe('高い');
  });
});
