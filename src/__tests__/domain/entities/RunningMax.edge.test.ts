import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRunningMax - エッジケース', () => {
  it('空配列は空配列', () => {
    expect(MathHelper.getRunningMax([])).toEqual([]);
  });

  it('1要素はそのまま', () => {
    expect(MathHelper.getRunningMax([42])).toEqual([42]);
  });

  it('2要素の昇順', () => {
    expect(MathHelper.getRunningMax([10, 20])).toEqual([10, 20]);
  });

  it('2要素の降順', () => {
    expect(MathHelper.getRunningMax([20, 10])).toEqual([20, 20]);
  });

  it('全て0', () => {
    expect(MathHelper.getRunningMax([0, 0, 0])).toEqual([0, 0, 0]);
  });

  it('全て負の値の昇順', () => {
    expect(MathHelper.getRunningMax([-30, -20, -10])).toEqual([-30, -20, -10]);
  });

  it('全て負の値の降順', () => {
    expect(MathHelper.getRunningMax([-10, -20, -30])).toEqual([-10, -10, -10]);
  });

  it('V字型パターン', () => {
    expect(MathHelper.getRunningMax([50, 30, 10, 30, 50])).toEqual([50, 50, 50, 50, 50]);
  });

  it('山型パターン', () => {
    expect(MathHelper.getRunningMax([10, 30, 50, 30, 10])).toEqual([10, 30, 50, 50, 50]);
  });

  it('大量データでも正しく処理', () => {
    const data = Array.from({ length: 100 }, (_, i) => i % 10);
    const result = MathHelper.getRunningMax(data);
    expect(result).toHaveLength(100);
    expect(result[0]).toBe(0);
    expect(result[9]).toBe(9);
    expect(result[99]).toBe(9);
  });

  it('小数値', () => {
    expect(MathHelper.getRunningMax([1.5, 2.3, 1.8, 3.1])).toEqual([1.5, 2.3, 2.3, 3.1]);
  });

  it('非常に大きな値', () => {
    expect(MathHelper.getRunningMax([1000000, 999999])).toEqual([1000000, 1000000]);
  });

  it('同じ値が続いた後に更新', () => {
    expect(MathHelper.getRunningMax([5, 5, 5, 10, 10])).toEqual([5, 5, 5, 10, 10]);
  });

  it('結果は必ず単調非減少', () => {
    const data = [3, 1, 4, 1, 5, 9, 2, 6];
    const result = MathHelper.getRunningMax(data);
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(result[i - 1]);
    }
  });
});

describe('MathHelper.getRunningMaxLabel - 境界値', () => {
  it('現在値=最大値は最高値', () => {
    expect(MathHelper.getRunningMaxLabel(100, 100)).toBe('最高値');
  });

  it('現在値が最大値の90%ちょうどは最高値付近', () => {
    expect(MathHelper.getRunningMaxLabel(90, 100)).toBe('最高値付近');
  });

  it('現在値が最大値の89%は最高値以下', () => {
    expect(MathHelper.getRunningMaxLabel(89, 100)).toBe('最高値以下');
  });

  it('最大値0の場合は最高値以下', () => {
    expect(MathHelper.getRunningMaxLabel(0, 0)).toBe('最高値以下');
  });

  it('現在値0で最大値が正の場合は最高値以下', () => {
    expect(MathHelper.getRunningMaxLabel(0, 100)).toBe('最高値以下');
  });
});
