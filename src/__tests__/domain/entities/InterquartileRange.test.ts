import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getInterquartileRange', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getInterquartileRange([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(MathHelper.getInterquartileRange([50])).toBe(0);
  });

  it('Q3-Q1の差を返す', () => {
    const result = MathHelper.getInterquartileRange([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(result).toBeGreaterThan(0);
  });

  it('全て同じ値は0', () => {
    expect(MathHelper.getInterquartileRange([5, 5, 5, 5])).toBe(0);
  });

  it('ばらつきが大きいほどIQRが大きい', () => {
    const small = MathHelper.getInterquartileRange([48, 49, 50, 51, 52]);
    const large = MathHelper.getInterquartileRange([10, 30, 50, 70, 90]);
    expect(large).toBeGreaterThan(small);
  });

  it('結果は0以上', () => {
    expect(MathHelper.getInterquartileRange([1, 3, 5, 7])).toBeGreaterThanOrEqual(0);
  });
});

describe('MathHelper.getIQRLabel', () => {
  it('IQR 5以下は安定', () => {
    expect(MathHelper.getIQRLabel(3)).toBe('安定');
  });

  it('IQR 20以下はやや散布', () => {
    expect(MathHelper.getIQRLabel(10)).toBe('やや散布');
  });

  it('IQR 20超は散布', () => {
    expect(MathHelper.getIQRLabel(30)).toBe('散布');
  });
});
