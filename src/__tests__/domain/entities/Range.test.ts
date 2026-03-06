import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRange', () => {
  it('空配列は0', () => {
    expect(MathHelper.getRange([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MathHelper.getRange([5])).toBe(0);
  });

  it('同じ値は0', () => {
    expect(MathHelper.getRange([3, 3, 3])).toBe(0);
  });

  it('正値の範囲', () => {
    expect(MathHelper.getRange([1, 5, 3])).toBe(4);
  });

  it('負値を含む範囲', () => {
    expect(MathHelper.getRange([-5, 5])).toBe(10);
  });

  it('全て負値', () => {
    expect(MathHelper.getRange([-10, -3, -7])).toBe(7);
  });

  it('昇順データ', () => {
    expect(MathHelper.getRange([1, 2, 3, 4, 5])).toBe(4);
  });

  it('降順データ', () => {
    expect(MathHelper.getRange([10, 8, 6, 4, 2])).toBe(8);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getRange([100, 50, 75]);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('MathHelper.getRangeLabel', () => {
  it('小さい範囲は狭い', () => {
    expect(MathHelper.getRangeLabel(3)).toBe('狭い');
  });

  it('中程度の範囲はやや広い', () => {
    expect(MathHelper.getRangeLabel(15)).toBe('やや広い');
  });

  it('大きい範囲は広い', () => {
    expect(MathHelper.getRangeLabel(30)).toBe('広い');
  });
});
