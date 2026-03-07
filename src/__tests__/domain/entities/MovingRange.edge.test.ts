import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMovingRange - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getMovingRange([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getMovingRange([42])).toBe(0);
  });

  it('2件同値は0', () => {
    expect(MathHelper.getMovingRange([5, 5])).toBe(0);
  });

  it('全て同じは0', () => {
    expect(MathHelper.getMovingRange([10, 10, 10, 10])).toBe(0);
  });

  it('2件の差', () => {
    expect(MathHelper.getMovingRange([0, 100])).toBe(100);
  });

  it('均等な増加', () => {
    expect(MathHelper.getMovingRange([0, 5, 10, 15])).toBe(5);
  });

  it('均等な減少', () => {
    expect(MathHelper.getMovingRange([15, 10, 5, 0])).toBe(5);
  });

  it('交互変動', () => {
    expect(MathHelper.getMovingRange([0, 10, 0, 10])).toBe(10);
  });

  it('負の値', () => {
    expect(MathHelper.getMovingRange([-10, 10])).toBe(20);
  });

  it('小数値', () => {
    const result = MathHelper.getMovingRange([0.1, 0.3, 0.5]);
    expect(result).toBeCloseTo(0.2, 1);
  });

  it('大量データで均一', () => {
    const data = Array(100).fill(50);
    expect(MathHelper.getMovingRange(data)).toBe(0);
  });

  it('結果は常に0以上', () => {
    const result = MathHelper.getMovingRange([100, 1, 50, 25]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('変動が大きいほどMRが大きい', () => {
    const stable = MathHelper.getMovingRange([10, 11, 12, 13]);
    const volatile = MathHelper.getMovingRange([10, 50, 5, 80]);
    expect(volatile).toBeGreaterThan(stable);
  });
});

describe('MathHelper.getMovingRangeLabel - エッジケース', () => {
  it('0は安定', () => {
    expect(MathHelper.getMovingRangeLabel(0)).toBe('安定');
  });

  it('5は安定', () => {
    expect(MathHelper.getMovingRangeLabel(5)).toBe('安定');
  });

  it('6はやや変動', () => {
    expect(MathHelper.getMovingRangeLabel(6)).toBe('やや変動');
  });

  it('20はやや変動', () => {
    expect(MathHelper.getMovingRangeLabel(20)).toBe('やや変動');
  });

  it('21は変動大', () => {
    expect(MathHelper.getMovingRangeLabel(21)).toBe('変動大');
  });

  it('100は変動大', () => {
    expect(MathHelper.getMovingRangeLabel(100)).toBe('変動大');
  });
});
