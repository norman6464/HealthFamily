import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getTrimmedMean - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(MathHelper.getTrimmedMean([], 25)).toBe(0);
  });

  it('1要素でトリム率50%でもその値を返す', () => {
    expect(MathHelper.getTrimmedMean([42], 50)).toBe(42);
  });

  it('2要素でトリム0%は平均を返す', () => {
    expect(MathHelper.getTrimmedMean([10, 20], 0)).toBe(15);
  });

  it('2要素でトリム率が高くても中央の要素を返す', () => {
    const result = MathHelper.getTrimmedMean([10, 20], 40);
    expect(result).toBeGreaterThan(0);
  });

  it('負の値を含む配列', () => {
    expect(MathHelper.getTrimmedMean([-10, -5, 0, 5, 10], 0)).toBe(0);
  });

  it('負の値を含むトリム平均', () => {
    // [-10,-5,0,5,10] trim 20% -> floor(5*0.2)=1 -> [-5,0,5] -> avg=0
    expect(MathHelper.getTrimmedMean([-10, -5, 0, 5, 10], 20)).toBe(0);
  });

  it('全て同じ値ならトリム率に関係なく同じ値', () => {
    expect(MathHelper.getTrimmedMean([5, 5, 5, 5, 5], 0)).toBe(5);
    expect(MathHelper.getTrimmedMean([5, 5, 5, 5, 5], 20)).toBe(5);
    expect(MathHelper.getTrimmedMean([5, 5, 5, 5, 5], 40)).toBe(5);
  });

  it('トリム率0%は通常の平均と一致', () => {
    const values = [3, 7, 2, 9, 4];
    const trimmed = MathHelper.getTrimmedMean(values, 0);
    const normal = MathHelper.calculateAverage(values);
    expect(trimmed).toBe(normal);
  });

  it('大きな外れ値がある場合トリム平均はロバスト', () => {
    const values = [10, 11, 12, 13, 14, 1000];
    const trimmed = MathHelper.getTrimmedMean(values, 20);
    expect(trimmed).toBeLessThan(20);
  });

  it('100要素の大量データ', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const result = MathHelper.getTrimmedMean(values, 10);
    expect(result).toBeGreaterThan(40);
    expect(result).toBeLessThan(60);
  });

  it('小数点1桁に丸められる', () => {
    const result = MathHelper.getTrimmedMean([1, 2, 3, 4, 5, 6, 7], 0);
    const decimalPart = result.toString().split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(1);
  });

  it('トリム率49%でも動作する', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = MathHelper.getTrimmedMean(values, 49);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MathHelper.getTrimmedMeanLabel - 境界値', () => {
  it('値70は高い(境界値)', () => {
    expect(MathHelper.getTrimmedMeanLabel(70)).toBe('高い');
  });

  it('値69は中程度', () => {
    expect(MathHelper.getTrimmedMeanLabel(69)).toBe('中程度');
  });

  it('値30は中程度(境界値)', () => {
    expect(MathHelper.getTrimmedMeanLabel(30)).toBe('中程度');
  });

  it('値29は低い', () => {
    expect(MathHelper.getTrimmedMeanLabel(29)).toBe('低い');
  });
});
