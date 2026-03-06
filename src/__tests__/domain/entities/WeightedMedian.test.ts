import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getWeightedMedian', () => {
  it('空配列は0', () => {
    expect(MathHelper.getWeightedMedian([], [])).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getWeightedMedian([50], [1])).toBe(50);
  });

  it('均等な重みは通常の中央値と同じ', () => {
    const result = MathHelper.getWeightedMedian([10, 20, 30], [1, 1, 1]);
    expect(result).toBe(20);
  });

  it('重みが大きい方に寄る', () => {
    const result = MathHelper.getWeightedMedian([10, 90], [9, 1]);
    expect(result).toBe(10);
  });

  it('値と重みの長さが異なる場合は0', () => {
    expect(MathHelper.getWeightedMedian([10, 20], [1])).toBe(0);
  });

  it('全て同値は同値', () => {
    expect(MathHelper.getWeightedMedian([50, 50, 50], [1, 2, 3])).toBe(50);
  });

  it('大量データでも正常', () => {
    const values = Array.from({ length: 100 }, (_, i) => i);
    const weights = Array.from({ length: 100 }, () => 1);
    const result = MathHelper.getWeightedMedian(values, weights);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('MathHelper.getWeightedMedianLabel', () => {
  it('値が高いと高い', () => {
    expect(MathHelper.getWeightedMedianLabel(80)).toBe('高い');
  });

  it('値が中程度', () => {
    expect(MathHelper.getWeightedMedianLabel(50)).toBe('中程度');
  });

  it('値が低い', () => {
    expect(MathHelper.getWeightedMedianLabel(20)).toBe('低い');
  });
});
