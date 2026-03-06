import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMeanAbsoluteDeviation - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([42])).toBe(0);
  });

  it('2件の同値は0', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([7, 7])).toBe(0);
  });

  it('全て同じ値は0', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([5, 5, 5, 5, 5])).toBe(0);
  });

  it('2件の異なる値', () => {
    // [0, 10] -> avg=5, |0-5|+|10-5| = 10, 10/2 = 5
    expect(MathHelper.getMeanAbsoluteDeviation([0, 10])).toBe(5);
  });

  it('負の値のみ', () => {
    // [-10, -20] -> avg=-15, |-10-(-15)|+|-20-(-15)| = 5+5 = 10, 10/2 = 5
    expect(MathHelper.getMeanAbsoluteDeviation([-10, -20])).toBe(5);
  });

  it('0のみ', () => {
    expect(MathHelper.getMeanAbsoluteDeviation([0, 0, 0])).toBe(0);
  });

  it('大きな値', () => {
    const result = MathHelper.getMeanAbsoluteDeviation([1000000, 2000000]);
    expect(result).toBe(500000);
  });

  it('小数値', () => {
    const result = MathHelper.getMeanAbsoluteDeviation([1.5, 2.5]);
    expect(result).toBe(0.5);
  });

  it('外れ値を含む', () => {
    const withoutOutlier = MathHelper.getMeanAbsoluteDeviation([10, 11, 12]);
    const withOutlier = MathHelper.getMeanAbsoluteDeviation([10, 11, 100]);
    expect(withOutlier).toBeGreaterThan(withoutOutlier);
  });

  it('大量データ', () => {
    const data = Array(100).fill(50);
    expect(MathHelper.getMeanAbsoluteDeviation(data)).toBe(0);
  });

  it('昇順データ', () => {
    // [1,2,3,4,5] -> avg=3, |1-3|+|2-3|+|3-3|+|4-3|+|5-3| = 2+1+0+1+2 = 6, 6/5 = 1.2
    expect(MathHelper.getMeanAbsoluteDeviation([1, 2, 3, 4, 5])).toBe(1.2);
  });

  it('結果は常に0以上', () => {
    const result = MathHelper.getMeanAbsoluteDeviation([-100, 100, -50, 50]);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('MathHelper.getMeanAbsoluteDeviationLabel - エッジケース', () => {
  it('0は安定', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(0)).toBe('安定');
  });

  it('5は安定', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(5)).toBe('安定');
  });

  it('5.01はやや散布', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(5.01)).toBe('やや散布');
  });

  it('15はやや散布', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(15)).toBe('やや散布');
  });

  it('15.01は散布', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(15.01)).toBe('散布');
  });

  it('100は散布', () => {
    expect(MathHelper.getMeanAbsoluteDeviationLabel(100)).toBe('散布');
  });
});
