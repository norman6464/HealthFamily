import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getExponentialSmoothing', () => {
  it('空配列は空', () => {
    expect(MathHelper.getExponentialSmoothing([], 0.5)).toEqual([]);
  });

  it('1要素はそのまま', () => {
    expect(MathHelper.getExponentialSmoothing([10], 0.5)).toEqual([10]);
  });

  it('alpha=1は元の系列と同じ', () => {
    const result = MathHelper.getExponentialSmoothing([1, 2, 3, 4, 5], 1);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('alpha=0は最初の値で固定', () => {
    const result = MathHelper.getExponentialSmoothing([1, 10, 20, 30], 0);
    expect(result).toEqual([1, 1, 1, 1]);
  });

  it('alpha=0.5で平滑化される', () => {
    const result = MathHelper.getExponentialSmoothing([10, 20, 30], 0.5);
    expect(result.length).toBe(3);
    expect(result[0]).toBe(10);
    expect(result[1]).toBe(15);
  });

  it('結果の要素数は入力と同じ', () => {
    const result = MathHelper.getExponentialSmoothing([1, 2, 3, 4, 5], 0.3);
    expect(result.length).toBe(5);
  });

  it('小数第2位まで丸められる', () => {
    const result = MathHelper.getExponentialSmoothing([1, 5, 3, 7], 0.3);
    result.forEach((v) => {
      const str = v.toString();
      const decimals = str.split('.')[1];
      expect(!decimals || decimals.length <= 2).toBe(true);
    });
  });

  it('定数系列は変わらない', () => {
    const result = MathHelper.getExponentialSmoothing([5, 5, 5, 5], 0.5);
    result.forEach((v) => expect(v).toBe(5));
  });

  it('alpha範囲外は0にクランプ', () => {
    const result = MathHelper.getExponentialSmoothing([1, 10], -0.5);
    expect(result).toEqual([1, 1]);
  });

  it('alpha>1は1にクランプ', () => {
    const result = MathHelper.getExponentialSmoothing([1, 10], 1.5);
    expect(result).toEqual([1, 10]);
  });

  it('増加系列は遅れて追従', () => {
    const result = MathHelper.getExponentialSmoothing([0, 10, 20, 30], 0.5);
    expect(result[1]).toBeLessThan(10);
    expect(result[3]).toBeLessThan(30);
  });
});

describe('MathHelper.getExponentialSmoothingLabel', () => {
  it('alpha高は反応的', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0.8)).toBe('反応的');
  });

  it('alpha中はバランス', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0.5)).toBe('バランス');
  });

  it('alpha低は安定的', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0.2)).toBe('安定的');
  });
});
