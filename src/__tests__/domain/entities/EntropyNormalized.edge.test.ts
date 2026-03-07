import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getEntropyNormalized エッジケース', () => {
  it('負の値を含む配列', () => {
    const result = MathHelper.getEntropyNormalized([-10, 20, 30]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('非常に大きな値の配列', () => {
    const result = MathHelper.getEntropyNormalized([1000000, 1000000, 1000000]);
    expect(result).toBe(100);
  });

  it('小数値の配列', () => {
    const result = MathHelper.getEntropyNormalized([0.1, 0.2, 0.3, 0.4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2要素で均等', () => {
    expect(MathHelper.getEntropyNormalized([50, 50])).toBe(100);
  });

  it('2要素で極端な偏り', () => {
    const result = MathHelper.getEntropyNormalized([99, 1]);
    expect(result).toBeLessThan(30);
  });

  it('多数の要素で均等', () => {
    const result = MathHelper.getEntropyNormalized([10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
    expect(result).toBe(100);
  });

  it('多数の要素で1つだけ非ゼロ', () => {
    expect(MathHelper.getEntropyNormalized([0, 0, 0, 0, 100])).toBe(0);
  });

  it('3要素で1つだけゼロ', () => {
    const result = MathHelper.getEntropyNormalized([50, 50, 0]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('整数に丸められる', () => {
    const result = MathHelper.getEntropyNormalized([30, 30, 40]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('要素数が1000でも動作する', () => {
    const values = Array.from({ length: 1000 }, () => 1);
    const result = MathHelper.getEntropyNormalized(values);
    expect(result).toBe(100);
  });

  it('合計が非常に小さい正の値', () => {
    const result = MathHelper.getEntropyNormalized([0.001, 0.001]);
    expect(result).toBe(100);
  });

  it('ほぼ均等な分布', () => {
    const result = MathHelper.getEntropyNormalized([25, 25, 25, 26]);
    expect(result).toBeGreaterThan(95);
  });
});

describe('MathHelper.getEntropyNormalizedLabel エッジケース', () => {
  it('境界値80は均一', () => {
    expect(MathHelper.getEntropyNormalizedLabel(80)).toBe('均一');
  });

  it('境界値40はやや偏り', () => {
    expect(MathHelper.getEntropyNormalizedLabel(40)).toBe('やや偏り');
  });

  it('境界値79はやや偏り', () => {
    expect(MathHelper.getEntropyNormalizedLabel(79)).toBe('やや偏り');
  });

  it('境界値39は偏り大', () => {
    expect(MathHelper.getEntropyNormalizedLabel(39)).toBe('偏り大');
  });

  it('0は偏り大', () => {
    expect(MathHelper.getEntropyNormalizedLabel(0)).toBe('偏り大');
  });

  it('100は均一', () => {
    expect(MathHelper.getEntropyNormalizedLabel(100)).toBe('均一');
  });
});
