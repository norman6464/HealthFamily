import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getExponentialSmoothing エッジケース', () => {
  it('alpha=0.1は非常に安定した平滑化', () => {
    const result = MathHelper.getExponentialSmoothing([10, 100, 10, 100], 0.1);
    expect(result[3]).toBeLessThan(50);
  });

  it('alpha=0.9は元の値に近い', () => {
    const result = MathHelper.getExponentialSmoothing([10, 100, 10, 100], 0.9);
    expect(result[3]).toBeGreaterThan(80);
  });

  it('負の値を含む系列', () => {
    const result = MathHelper.getExponentialSmoothing([-10, 10, -10, 10], 0.5);
    expect(result.length).toBe(4);
    expect(result[0]).toBe(-10);
  });

  it('全て0の系列', () => {
    const result = MathHelper.getExponentialSmoothing([0, 0, 0, 0], 0.5);
    result.forEach((v) => expect(v).toBe(0));
  });

  it('非常に大きな値', () => {
    const result = MathHelper.getExponentialSmoothing([1000000, 2000000], 0.5);
    expect(result[1]).toBe(1500000);
  });

  it('非常に小さな値', () => {
    const result = MathHelper.getExponentialSmoothing([0.001, 0.002], 0.5);
    expect(result.length).toBe(2);
  });

  it('2要素でalpha=0.5', () => {
    const result = MathHelper.getExponentialSmoothing([0, 10], 0.5);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(5);
  });

  it('多数の要素', () => {
    const values = Array.from({ length: 100 }, (_, i) => Math.sin(i) * 10);
    const result = MathHelper.getExponentialSmoothing(values, 0.3);
    expect(result.length).toBe(100);
  });

  it('最初の値は常に元のまま', () => {
    expect(MathHelper.getExponentialSmoothing([42, 100, 200], 0.5)[0]).toBe(42);
    expect(MathHelper.getExponentialSmoothing([42, 100, 200], 0.1)[0]).toBe(42);
    expect(MathHelper.getExponentialSmoothing([42, 100, 200], 0.9)[0]).toBe(42);
  });

  it('alpha=-1は0にクランプ', () => {
    const result = MathHelper.getExponentialSmoothing([1, 10, 20], -1);
    expect(result).toEqual([1, 1, 1]);
  });

  it('alpha=2は1にクランプ', () => {
    const result = MathHelper.getExponentialSmoothing([1, 10, 20], 2);
    expect(result).toEqual([1, 10, 20]);
  });

  it('急激な変化の平滑化', () => {
    const result = MathHelper.getExponentialSmoothing([0, 0, 0, 100, 100, 100], 0.5);
    expect(result[3]).toBeLessThan(100);
    expect(result[5]).toBeGreaterThan(result[3]);
  });

  it('小数第2位まで丸められる', () => {
    const result = MathHelper.getExponentialSmoothing([1, 3, 7, 2], 0.3);
    result.forEach((v) => {
      const str = v.toString();
      const decimals = str.split('.')[1];
      expect(!decimals || decimals.length <= 2).toBe(true);
    });
  });
});

describe('MathHelper.getExponentialSmoothingLabel エッジケース', () => {
  it('境界値0.7は反応的', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0.7)).toBe('反応的');
  });

  it('境界値0.3はバランス', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0.3)).toBe('バランス');
  });

  it('境界値0.69はバランス', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0.69)).toBe('バランス');
  });

  it('境界値0.29は安定的', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0.29)).toBe('安定的');
  });

  it('0は安定的', () => {
    expect(MathHelper.getExponentialSmoothingLabel(0)).toBe('安定的');
  });

  it('1は反応的', () => {
    expect(MathHelper.getExponentialSmoothingLabel(1)).toBe('反応的');
  });
});
