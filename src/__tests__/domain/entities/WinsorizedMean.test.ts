import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getWinsorizedMean', () => {
  it('空配列は0', () => {
    expect(MathHelper.getWinsorizedMean([], 10)).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getWinsorizedMean([42], 10)).toBe(42);
  });

  it('同値は同じ', () => {
    expect(MathHelper.getWinsorizedMean([5, 5, 5], 20)).toBe(5);
  });

  it('外れ値を端に置換', () => {
    // [1, 2, 3, 4, 100] 20%置換 -> [2, 2, 3, 4, 4] -> 平均3
    expect(MathHelper.getWinsorizedMean([1, 2, 3, 4, 100], 20)).toBe(3);
  });

  it('トリム0は通常の平均', () => {
    expect(MathHelper.getWinsorizedMean([10, 20, 30], 0)).toBe(20);
  });

  it('外れ値の影響が軽減される', () => {
    const withOutlier = [1, 2, 3, 4, 5, 100];
    const winsorized = MathHelper.getWinsorizedMean(withOutlier, 20);
    const regular = withOutlier.reduce((a, b) => a + b, 0) / withOutlier.length;
    expect(winsorized).toBeLessThan(regular);
  });

  it('2件は通常平均', () => {
    expect(MathHelper.getWinsorizedMean([10, 20], 10)).toBe(15);
  });

  it('結果は数値', () => {
    const result = MathHelper.getWinsorizedMean([3, 6, 9, 12], 10);
    expect(typeof result).toBe('number');
  });
});

describe('MathHelper.getWinsorizedMeanLabel', () => {
  it('高い値は高い', () => {
    expect(MathHelper.getWinsorizedMeanLabel(75)).toBe('高い');
  });

  it('中程度は中程度', () => {
    expect(MathHelper.getWinsorizedMeanLabel(50)).toBe('中程度');
  });

  it('低い値は低い', () => {
    expect(MathHelper.getWinsorizedMeanLabel(20)).toBe('低い');
  });
});
