import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getWeightedMedian - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getWeightedMedian([], [])).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getWeightedMedian([42], [1])).toBe(42);
  });

  it('長さ不一致は0', () => {
    expect(MathHelper.getWeightedMedian([10, 20], [1])).toBe(0);
    expect(MathHelper.getWeightedMedian([10], [1, 2])).toBe(0);
  });

  it('全て重み0は0', () => {
    expect(MathHelper.getWeightedMedian([10, 20, 30], [0, 0, 0])).toBe(0);
  });

  it('2件の均等重み', () => {
    const result = MathHelper.getWeightedMedian([10, 90], [1, 1]);
    expect(result).toBe(10);
  });

  it('重みが偏ると結果も偏る', () => {
    const heavyFirst = MathHelper.getWeightedMedian([10, 90], [100, 1]);
    const heavySecond = MathHelper.getWeightedMedian([10, 90], [1, 100]);
    expect(heavyFirst).toBe(10);
    expect(heavySecond).toBe(90);
  });

  it('全て同値は同値', () => {
    expect(MathHelper.getWeightedMedian([50, 50, 50], [1, 5, 10])).toBe(50);
  });

  it('ソートされていないデータ', () => {
    const result = MathHelper.getWeightedMedian([30, 10, 20], [1, 1, 1]);
    expect(result).toBe(20);
  });

  it('負の値', () => {
    const result = MathHelper.getWeightedMedian([-10, 0, 10], [1, 1, 1]);
    expect(result).toBe(0);
  });

  it('大量データでも正常', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const weights = Array.from({ length: 100 }, () => 1);
    const result = MathHelper.getWeightedMedian(values, weights);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(99);
  });

  it('小数値', () => {
    const result = MathHelper.getWeightedMedian([0.1, 0.5, 0.9], [1, 1, 1]);
    expect(result).toBe(0.5);
  });

  it('3件で最後の値が重い', () => {
    const result = MathHelper.getWeightedMedian([10, 50, 90], [1, 1, 10]);
    expect(result).toBe(90);
  });

  it('重み1件のみ有効', () => {
    const result = MathHelper.getWeightedMedian([10, 50, 90], [0, 0, 1]);
    expect(result).toBe(90);
  });
});

describe('MathHelper.getWeightedMedianLabel - 境界値', () => {
  it('値0は低い', () => {
    expect(MathHelper.getWeightedMedianLabel(0)).toBe('低い');
  });

  it('値39は低い', () => {
    expect(MathHelper.getWeightedMedianLabel(39)).toBe('低い');
  });

  it('値40は中程度(境界値)', () => {
    expect(MathHelper.getWeightedMedianLabel(40)).toBe('中程度');
  });

  it('値69は中程度', () => {
    expect(MathHelper.getWeightedMedianLabel(69)).toBe('中程度');
  });

  it('値70は高い(境界値)', () => {
    expect(MathHelper.getWeightedMedianLabel(70)).toBe('高い');
  });

  it('値100は高い', () => {
    expect(MathHelper.getWeightedMedianLabel(100)).toBe('高い');
  });
});
