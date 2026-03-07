import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getQuartileDeviation', () => {
  it('空配列は0', () => {
    expect(MathHelper.getQuartileDeviation([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getQuartileDeviation([42])).toBe(0);
  });

  it('2件は差の半分', () => {
    expect(MathHelper.getQuartileDeviation([10, 20])).toBe(2.5);
  });

  it('同値は0', () => {
    expect(MathHelper.getQuartileDeviation([5, 5, 5, 5])).toBe(0);
  });

  it('偏りが大きいほど値が大きい', () => {
    const narrow = MathHelper.getQuartileDeviation([10, 11, 12, 13]);
    const wide = MathHelper.getQuartileDeviation([1, 10, 50, 100]);
    expect(wide).toBeGreaterThan(narrow);
  });

  it('4要素で正しい値', () => {
    // [1, 2, 3, 4] -> Q1=1.75, Q3=3.25 -> QD=(3.25-1.75)/2=0.75
    expect(MathHelper.getQuartileDeviation([1, 2, 3, 4])).toBe(0.75);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getQuartileDeviation([3, 7, 1, 9, 5]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('負の値を含む配列', () => {
    const result = MathHelper.getQuartileDeviation([-10, -5, 0, 5, 10]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('結果は数値', () => {
    const result = MathHelper.getQuartileDeviation([2, 4, 6, 8, 10]);
    expect(typeof result).toBe('number');
  });
});

describe('MathHelper.getQuartileDeviationLabel', () => {
  it('小さい値は均一', () => {
    expect(MathHelper.getQuartileDeviationLabel(3)).toBe('均一');
  });

  it('中程度はやや散布', () => {
    expect(MathHelper.getQuartileDeviationLabel(12)).toBe('やや散布');
  });

  it('大きい値は散布', () => {
    expect(MathHelper.getQuartileDeviationLabel(30)).toBe('散布');
  });
});
