import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getEntropyNormalized', () => {
  it('空配列は0', () => {
    expect(MathHelper.getEntropyNormalized([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getEntropyNormalized([100])).toBe(0);
  });

  it('全て同値は100', () => {
    expect(MathHelper.getEntropyNormalized([25, 25, 25, 25])).toBe(100);
  });

  it('1つだけ正は0', () => {
    expect(MathHelper.getEntropyNormalized([100, 0, 0])).toBe(0);
  });

  it('2つ均等は100', () => {
    expect(MathHelper.getEntropyNormalized([50, 50])).toBe(100);
  });

  it('偏りが大きいほど低い', () => {
    const balanced = MathHelper.getEntropyNormalized([25, 25, 25, 25]);
    const skewed = MathHelper.getEntropyNormalized([90, 5, 3, 2]);
    expect(balanced).toBeGreaterThan(skewed);
  });

  it('結果は0-100の範囲', () => {
    const result = MathHelper.getEntropyNormalized([40, 30, 20, 10]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('全て0は0', () => {
    expect(MathHelper.getEntropyNormalized([0, 0, 0])).toBe(0);
  });
});

describe('MathHelper.getEntropyNormalizedLabel', () => {
  it('高い値は均一', () => {
    expect(MathHelper.getEntropyNormalizedLabel(85)).toBe('均一');
  });

  it('中程度はやや偏り', () => {
    expect(MathHelper.getEntropyNormalizedLabel(55)).toBe('やや偏り');
  });

  it('低い値は偏り大', () => {
    expect(MathHelper.getEntropyNormalizedLabel(25)).toBe('偏り大');
  });
});
