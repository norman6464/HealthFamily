import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getGeometricStandardDeviation', () => {
  it('空配列は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([10])).toBe(0);
  });

  it('同値は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([5, 5, 5])).toBe(0);
  });

  it('0を含む場合は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([0, 10, 20])).toBe(0);
  });

  it('負の値は0', () => {
    expect(MathHelper.getGeometricStandardDeviation([-5, 10])).toBe(0);
  });

  it('ばらつきがある場合は正の値', () => {
    const result = MathHelper.getGeometricStandardDeviation([2, 8, 32]);
    expect(result).toBeGreaterThan(0);
  });

  it('ばらつきが大きいほど値が大きい', () => {
    const small = MathHelper.getGeometricStandardDeviation([9, 10, 11]);
    const large = MathHelper.getGeometricStandardDeviation([1, 10, 100]);
    expect(large).toBeGreaterThan(small);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getGeometricStandardDeviation([3, 6, 9]);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('MathHelper.getGeometricStandardDeviationLabel', () => {
  it('低い値は均一', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(0.3)).toBe('均一');
  });

  it('中程度はやや散布', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(1.5)).toBe('やや散布');
  });

  it('高い値は散布', () => {
    expect(MathHelper.getGeometricStandardDeviationLabel(3)).toBe('散布');
  });
});
