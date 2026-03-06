import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRunningMin - エッジケース', () => {
  it('空配列は空配列', () => {
    expect(MathHelper.getRunningMin([])).toEqual([]);
  });

  it('1件は同値配列', () => {
    expect(MathHelper.getRunningMin([42])).toEqual([42]);
  });

  it('全て同じ値は同値配列', () => {
    expect(MathHelper.getRunningMin([5, 5, 5, 5])).toEqual([5, 5, 5, 5]);
  });

  it('昇順は最初の値で固定', () => {
    expect(MathHelper.getRunningMin([1, 2, 3, 4, 5])).toEqual([1, 1, 1, 1, 1]);
  });

  it('降順は各値が最小', () => {
    expect(MathHelper.getRunningMin([5, 4, 3, 2, 1])).toEqual([5, 4, 3, 2, 1]);
  });

  it('負の値を含む場合', () => {
    expect(MathHelper.getRunningMin([3, -1, 5, -3, 2])).toEqual([3, -1, -1, -3, -3]);
  });

  it('0を含む場合', () => {
    expect(MathHelper.getRunningMin([3, 0, 5, 0, 2])).toEqual([3, 0, 0, 0, 0]);
  });

  it('大きな値の配列', () => {
    expect(MathHelper.getRunningMin([1000000, 500000, 750000])).toEqual([1000000, 500000, 500000]);
  });

  it('小数値', () => {
    expect(MathHelper.getRunningMin([1.5, 0.5, 2.5])).toEqual([1.5, 0.5, 0.5]);
  });

  it('2件で前が小さい', () => {
    expect(MathHelper.getRunningMin([1, 10])).toEqual([1, 1]);
  });

  it('2件で後が小さい', () => {
    expect(MathHelper.getRunningMin([10, 1])).toEqual([10, 1]);
  });

  it('最後に最小値が来る場合', () => {
    expect(MathHelper.getRunningMin([10, 8, 6, 4, 2, 0])).toEqual([10, 8, 6, 4, 2, 0]);
  });

  it('V字パターン', () => {
    expect(MathHelper.getRunningMin([5, 3, 1, 3, 5])).toEqual([5, 3, 1, 1, 1]);
  });

  it('最小値が途中にある場合', () => {
    expect(MathHelper.getRunningMin([10, 5, 1, 5, 10])).toEqual([10, 5, 1, 1, 1]);
  });
});

describe('MathHelper.getRunningMinLabel - エッジケース', () => {
  it('同値は最低値', () => {
    expect(MathHelper.getRunningMinLabel(5, 5)).toBe('最低値');
  });

  it('現在値が最低値より小さい場合は最低値', () => {
    expect(MathHelper.getRunningMinLabel(3, 5)).toBe('最低値');
  });

  it('現在値が最低値より大きい場合は最低値以上', () => {
    expect(MathHelper.getRunningMinLabel(10, 5)).toBe('最低値以上');
  });

  it('0同士は最低値', () => {
    expect(MathHelper.getRunningMinLabel(0, 0)).toBe('最低値');
  });

  it('負の値で最低値', () => {
    expect(MathHelper.getRunningMinLabel(-5, -3)).toBe('最低値');
  });

  it('負の値で最低値以上', () => {
    expect(MathHelper.getRunningMinLabel(-1, -5)).toBe('最低値以上');
  });
});
