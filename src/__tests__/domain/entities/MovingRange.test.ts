import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMovingRange', () => {
  it('空配列は0', () => {
    expect(MathHelper.getMovingRange([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getMovingRange([5])).toBe(0);
  });

  it('全て同じは0', () => {
    expect(MathHelper.getMovingRange([3, 3, 3])).toBe(0);
  });

  it('2件の差', () => {
    expect(MathHelper.getMovingRange([10, 20])).toBe(10);
  });

  it('上昇系列', () => {
    expect(MathHelper.getMovingRange([1, 2, 3, 4])).toBe(1);
  });

  it('不規則な系列', () => {
    const result = MathHelper.getMovingRange([10, 5, 20, 15]);
    expect(result).toBeGreaterThan(0);
  });

  it('差が大きいほどMRが大きい', () => {
    const stable = MathHelper.getMovingRange([10, 11, 12]);
    const volatile = MathHelper.getMovingRange([10, 30, 5]);
    expect(volatile).toBeGreaterThan(stable);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getMovingRange([100, 50, 75, 25]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('負の値', () => {
    expect(MathHelper.getMovingRange([-5, 5])).toBe(10);
  });
});

describe('MathHelper.getMovingRangeLabel', () => {
  it('MR低は安定', () => {
    expect(MathHelper.getMovingRangeLabel(3)).toBe('安定');
  });

  it('MR中はやや変動', () => {
    expect(MathHelper.getMovingRangeLabel(12)).toBe('やや変動');
  });

  it('MR高は変動大', () => {
    expect(MathHelper.getMovingRangeLabel(25)).toBe('変動大');
  });
});
