import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMinMaxNormalized - エッジケース', () => {
  it('空配列は空配列', () => {
    expect(MathHelper.getMinMaxNormalized([])).toEqual([]);
  });

  it('1要素は[0]', () => {
    expect(MathHelper.getMinMaxNormalized([42])).toEqual([0]);
  });

  it('全て同じ値は全て0', () => {
    expect(MathHelper.getMinMaxNormalized([100, 100, 100])).toEqual([0, 0, 0]);
  });

  it('2要素の最小最大', () => {
    expect(MathHelper.getMinMaxNormalized([0, 100])).toEqual([0, 100]);
  });

  it('逆順でも正しく正規化', () => {
    expect(MathHelper.getMinMaxNormalized([100, 0])).toEqual([100, 0]);
  });

  it('負の値を含む', () => {
    const result = MathHelper.getMinMaxNormalized([-10, 0, 10]);
    expect(result[0]).toBe(0);
    expect(result[2]).toBe(100);
  });

  it('全て負の値', () => {
    const result = MathHelper.getMinMaxNormalized([-30, -20, -10]);
    expect(result[0]).toBe(0);
    expect(result[2]).toBe(100);
  });

  it('小数値', () => {
    const result = MathHelper.getMinMaxNormalized([1.0, 1.5, 2.0]);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(50);
    expect(result[2]).toBe(100);
  });

  it('大量データでも正しく処理', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const result = MathHelper.getMinMaxNormalized(data);
    expect(result[0]).toBe(0);
    expect(result[99]).toBe(100);
  });

  it('結果は0-100の範囲内', () => {
    const result = MathHelper.getMinMaxNormalized([5, 15, 25, 35, 45]);
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
  });

  it('最小値は常に0', () => {
    const result = MathHelper.getMinMaxNormalized([10, 20, 30]);
    expect(Math.min(...result)).toBe(0);
  });

  it('最大値は常に100(異なる値がある場合)', () => {
    const result = MathHelper.getMinMaxNormalized([10, 20, 30]);
    expect(Math.max(...result)).toBe(100);
  });

  it('結果の長さは入力と同じ', () => {
    const result = MathHelper.getMinMaxNormalized([1, 2, 3, 4, 5]);
    expect(result).toHaveLength(5);
  });
});

describe('MathHelper.getMinMaxNormalizedLabel - 境界値', () => {
  it('値80は高い(境界値)', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(80)).toBe('高い');
  });

  it('値79は中程度', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(79)).toBe('中程度');
  });

  it('値40は中程度(境界値)', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(40)).toBe('中程度');
  });

  it('値39は低い', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(39)).toBe('低い');
  });

  it('値0は低い', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(0)).toBe('低い');
  });

  it('値100は高い', () => {
    expect(MathHelper.getMinMaxNormalizedLabel(100)).toBe('高い');
  });
});
