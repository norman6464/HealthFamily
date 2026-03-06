import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getTrimmedMean', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getTrimmedMean([], 10)).toBe(0);
  });

  it('1要素はその値を返す', () => {
    expect(MathHelper.getTrimmedMean([5], 10)).toBe(5);
  });

  it('トリム0%は通常の平均と同じ', () => {
    expect(MathHelper.getTrimmedMean([1, 2, 3, 4, 5], 0)).toBe(3);
  });

  it('トリム10%で上下を除外した平均を返す', () => {
    // 10要素、上下10%=各1要素除外 -> [2,3,4,5,6,7,8,9] -> avg=5.5
    expect(MathHelper.getTrimmedMean([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10)).toBe(5.5);
  });

  it('トリム25%で上下を除外した平均を返す', () => {
    // 8要素、上下25%=各2要素除外 -> [3,4,5,6] -> avg=4.5
    expect(MathHelper.getTrimmedMean([1, 2, 3, 4, 5, 6, 7, 8], 25)).toBe(4.5);
  });

  it('外れ値がある場合にロバストな結果を返す', () => {
    const values = [10, 11, 12, 13, 14, 100];
    const trimmed = MathHelper.getTrimmedMean(values, 20);
    const normal = MathHelper.calculateAverage(values);
    expect(trimmed).toBeLessThan(normal);
  });

  it('ソートされていない配列も正しく処理する', () => {
    expect(MathHelper.getTrimmedMean([5, 1, 3, 2, 4], 0)).toBe(3);
  });

  it('全て同じ値なら結果も同じ', () => {
    expect(MathHelper.getTrimmedMean([7, 7, 7, 7], 25)).toBe(7);
  });

  it('トリム率が高くても少なくとも1要素残る', () => {
    const result = MathHelper.getTrimmedMean([1, 2, 3], 40);
    expect(result).toBeGreaterThan(0);
  });

  it('小数点1桁に丸められる', () => {
    const result = MathHelper.getTrimmedMean([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(1);
  });
});

describe('MathHelper.getTrimmedMeanLabel', () => {
  it('値70以上は高い', () => {
    expect(MathHelper.getTrimmedMeanLabel(70)).toBe('高い');
  });

  it('値30以上70未満は中程度', () => {
    expect(MathHelper.getTrimmedMeanLabel(50)).toBe('中程度');
  });

  it('値30未満は低い', () => {
    expect(MathHelper.getTrimmedMeanLabel(20)).toBe('低い');
  });
});
