import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getTrimmedMean', () => {
  it('空配列は0', () => {
    expect(MathHelper.getTrimmedMean([], 10)).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getTrimmedMean([42], 10)).toBe(42);
  });

  it('同値は同じ値', () => {
    expect(MathHelper.getTrimmedMean([5, 5, 5, 5, 5], 20)).toBe(5);
  });

  it('外れ値を除外', () => {
    // [1, 2, 3, 4, 100] trimPercent=20 -> 上下各1件除外 -> [2, 3, 4] -> 平均3
    expect(MathHelper.getTrimmedMean([1, 2, 3, 4, 100], 20)).toBe(3);
  });

  it('トリム0は通常の平均', () => {
    expect(MathHelper.getTrimmedMean([10, 20, 30], 0)).toBe(20);
  });

  it('外れ値の影響が軽減される', () => {
    const withOutlier = [1, 2, 3, 4, 5, 100];
    const trimmed = MathHelper.getTrimmedMean(withOutlier, 20);
    const regular = withOutlier.reduce((a, b) => a + b, 0) / withOutlier.length;
    expect(trimmed).toBeLessThan(regular);
  });

  it('結果は数値', () => {
    const result = MathHelper.getTrimmedMean([3, 6, 9, 12], 10);
    expect(typeof result).toBe('number');
  });

  it('2件でトリム不能なら通常平均', () => {
    expect(MathHelper.getTrimmedMean([10, 20], 10)).toBe(15);
  });
});

describe('MathHelper.getTrimmedMeanLabel', () => {
  it('高い値は高い', () => {
    expect(MathHelper.getTrimmedMeanLabel(75)).toBe('高い');
  });

  it('中程度は中程度', () => {
    expect(MathHelper.getTrimmedMeanLabel(50)).toBe('中程度');
  });

  it('低い値は低い', () => {
    expect(MathHelper.getTrimmedMeanLabel(20)).toBe('低い');
  });
});
