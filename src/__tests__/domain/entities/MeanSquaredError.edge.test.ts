import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMeanSquaredError - エッジケース', () => {
  it('両方空は0', () => {
    expect(MathHelper.getMeanSquaredError([], [])).toBe(0);
  });

  it('片方空は0', () => {
    expect(MathHelper.getMeanSquaredError([1, 2], [])).toBe(0);
  });

  it('完全一致1件は0', () => {
    expect(MathHelper.getMeanSquaredError([42], [42])).toBe(0);
  });

  it('完全一致複数は0', () => {
    expect(MathHelper.getMeanSquaredError([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBe(0);
  });

  it('差1の場合', () => {
    expect(MathHelper.getMeanSquaredError([0], [1])).toBe(1);
  });

  it('対称的な差', () => {
    const a = MathHelper.getMeanSquaredError([0, 10], [10, 0]);
    expect(a).toBe(100);
  });

  it('配列長が異なる（短い方に合わせる）', () => {
    expect(MathHelper.getMeanSquaredError([1], [1, 2, 3])).toBe(0);
  });

  it('全て0同士は0', () => {
    expect(MathHelper.getMeanSquaredError([0, 0, 0], [0, 0, 0])).toBe(0);
  });

  it('大きな値', () => {
    expect(MathHelper.getMeanSquaredError([0], [1000])).toBe(1000000);
  });

  it('小数の精度', () => {
    const result = MathHelper.getMeanSquaredError([0.1], [0.2]);
    expect(result).toBeCloseTo(0.01, 2);
  });

  it('負同士の差', () => {
    expect(MathHelper.getMeanSquaredError([-5], [-5])).toBe(0);
  });

  it('結果は常に0以上', () => {
    const result = MathHelper.getMeanSquaredError([100, -100], [-100, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('大量データ', () => {
    const a = Array(100).fill(10);
    const b = Array(100).fill(10);
    expect(MathHelper.getMeanSquaredError(a, b)).toBe(0);
  });

  it('差が大きいほどMSEが大きい', () => {
    const small = MathHelper.getMeanSquaredError([5], [6]);
    const large = MathHelper.getMeanSquaredError([5], [50]);
    expect(large).toBeGreaterThan(small);
  });

  it('順序を入れ替えても同値', () => {
    const a = MathHelper.getMeanSquaredError([1, 2], [3, 4]);
    const b = MathHelper.getMeanSquaredError([3, 4], [1, 2]);
    expect(a).toBe(b);
  });
});

describe('MathHelper.getMeanSquaredErrorLabel - エッジケース', () => {
  it('MSE 0は正確', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(0)).toBe('正確');
  });

  it('MSE 5は正確', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(5)).toBe('正確');
  });

  it('MSE 6はやや乖離', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(6)).toBe('やや乖離');
  });

  it('MSE 25はやや乖離', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(25)).toBe('やや乖離');
  });

  it('MSE 26は乖離大', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(26)).toBe('乖離大');
  });

  it('MSE 1000は乖離大', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(1000)).toBe('乖離大');
  });
});
