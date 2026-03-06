import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMeanAbsoluteDeviation', () => {
  it('空配列は0', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([5])).toBe(0);
  });

  it('同じ値は0', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([3, 3, 3])).toBe(0);
  });

  it('対称データ', () => {
    // [1, 5] -> avg=3, |1-3|+|5-3| = 2+2 = 4, 4/2 = 2
    expect(MathHelper.getMeanAbsoluteDeviation([1, 5])).toBe(2);
  });

  it('複数データ', () => {
    // [2, 4, 6, 8] -> avg=5, |2-5|+|4-5|+|6-5|+|8-5| = 3+1+1+3 = 8, 8/4 = 2
    expect(MathHelper.getMeanAbsoluteDeviation([2, 4, 6, 8])).toBe(2);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getMeanAbsoluteDeviation([10, 20, 30]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('ばらつきが大きいほど値が大きい', () => {
    const small = MathHelper.getMeanAbsoluteDeviation([9, 10, 11]);
    const large = MathHelper.getMeanAbsoluteDeviation([1, 10, 19]);
    expect(large).toBeGreaterThan(small);
  });

  it('負の値を含む', () => {
    // [-5, 5] -> avg=0, |-5|+|5| = 10, 10/2 = 5
    expect(MathHelper.getMeanAbsoluteDeviation([-5, 5])).toBe(5);
  });

  it('小数結果', () => {
    const result = MathHelper.getMeanAbsoluteDeviation([1, 2, 3]);
    expect(typeof result).toBe('number');
  });
});

describe('MathHelper.getMeanAbsoluteDeviationLabel', () => {
  it('MADが小さいは安定', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(3)).toBe('安定');
  });

  it('MADが中程度はやや散布', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(8)).toBe('やや散布');
  });

  it('MADが大きいは散布', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(20)).toBe('散布');
  });
});
