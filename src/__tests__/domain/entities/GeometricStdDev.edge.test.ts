import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getGeometricStandardDeviation - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([42])).toBe(0);
  });

  it('2件同値は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([10, 10])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([5, 5, 5, 5])).toBe(0);
  });

  it('0を含む場合は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([0, 5, 10])).toBe(0);
  });

  it('負の値は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([-1, 5])).toBe(0);
  });

  it('わずかなばらつき', () => {
    const result = MathHelper.getGeometricStandardDeviation([9, 10, 11]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('大きなばらつき', () => {
    const result = MathHelper.getGeometricStandardDeviation([1, 100, 10000]);
    expect(result).toBeGreaterThan(1);
  });

  it('ばらつきが大きいほど値が大きい', () => {
    const small = MathHelper.getGeometricStandardDeviation([10, 11, 12]);
    const large = MathHelper.getGeometricStandardDeviation([1, 50, 1000]);
    expect(large).toBeGreaterThan(small);
  });

  it('大量データで均一', () => {
    const data = Array(100).fill(7);
    expect(MathHelper.getGeometricStandardDeviation(data)).toBe(0);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getGeometricStandardDeviation([2, 4, 8]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('2件の差', () => {
    const result = MathHelper.getGeometricStandardDeviation([1, 100]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getGeometricStandardDeviationLabel - エッジケース', () => {
  it('0は均一', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(0)).toBe('均一');
  });

  it('0.5は均一', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(0.5)).toBe('均一');
  });

  it('0.51はやや散布', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(0.51)).toBe('やや散布');
  });

  it('2はやや散布', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(2)).toBe('やや散布');
  });

  it('2.01は散布', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(2.01)).toBe('散布');
  });

  it('10は散布', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(10)).toBe('散布');
  });
});
