import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getMeanSquaredError', () => {
  it('空配列は0', () => {
    expect(MathHelper.getMeanSquaredError([], [])).toBe(0);
  });

  it('完全一致は0', () => {
    expect(MathHelper.getMeanSquaredError([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it('差がある場合', () => {
    expect(MathHelper.getMeanSquaredError([1, 2, 3], [2, 3, 4])).toBe(1);
  });

  it('大きな差', () => {
    expect(MathHelper.getMeanSquaredError([0, 0], [10, 10])).toBe(100);
  });

  it('1件', () => {
    expect(MathHelper.getMeanSquaredError([5], [8])).toBe(9);
  });

  it('配列長が異なる場合は短い方に合わせる', () => {
    const result = MathHelper.getMeanSquaredError([1, 2], [1, 2, 3]);
    expect(result).toBe(0);
  });

  it('負の値', () => {
    expect(MathHelper.getMeanSquaredError([-1, -2], [1, 2])).toBe(10);
  });

  it('小数値', () => {
    const result = MathHelper.getMeanSquaredError([1.5], [2.5]);
    expect(result).toBe(1);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getMeanSquaredError([3, 7, 1], [5, 2, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('差が大きいほどMSEが大きい', () => {
    const small = MathHelper.getMeanSquaredError([1, 2, 3], [2, 3, 4]);
    const large = MathHelper.getMeanSquaredError([1, 2, 3], [10, 20, 30]);
    expect(large).toBeGreaterThan(small);
  });
});

describe('MathHelper.getMeanSquaredErrorLabel', () => {
  it('MSE低は正確', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(3)).toBe('正確');
  });

  it('MSE中はやや乖離', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(15)).toBe('やや乖離');
  });

  it('MSE高は乖離大', () => {
    expect(MathHelper.getMeanSquaredErrorLabel(30)).toBe('乖離大');
  });
});
