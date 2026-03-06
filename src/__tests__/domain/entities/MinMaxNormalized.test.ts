import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMinMaxNormalized', () => {
  it('空配列は空配列を返す', () => {
    expect(MathHelper.getMinMaxNormalized([])).toEqual([]);
  });

  it('1要素は[0]を返す', () => {
    expect(MathHelper.getMinMaxNormalized([50])).toEqual([0]);
  });

  it('全て同じ値は全て0', () => {
    expect(MathHelper.getMinMaxNormalized([5, 5, 5])).toEqual([0, 0, 0]);
  });

  it('2要素は[0, 100]', () => {
    expect(MathHelper.getMinMaxNormalized([10, 20])).toEqual([0, 100]);
  });

  it('昇順の正規化', () => {
    expect(MathHelper.getMinMaxNormalized([0, 50, 100])).toEqual([0, 50, 100]);
  });

  it('降順の正規化', () => {
    expect(MathHelper.getMinMaxNormalized([100, 50, 0])).toEqual([100, 50, 0]);
  });

  it('中間値は比率に応じた値', () => {
    const result = MathHelper.getMinMaxNormalized([10, 30, 50]);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(50);
    expect(result[2]).toBe(100);
  });

  it('結果は0-100の範囲内', () => {
    const result = MathHelper.getMinMaxNormalized([5, 15, 25, 35]);
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('MathHelper.getMinMaxNormalizedLabel', () => {
  it('値80以上は高い', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(85)).toBe('高い');
  });

  it('値40以上は中程度', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(50)).toBe('中程度');
  });

  it('値40未満は低い', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(20)).toBe('低い');
  });
});
