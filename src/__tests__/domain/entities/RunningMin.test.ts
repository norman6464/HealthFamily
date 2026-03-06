import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRunningMin', () => {
  it('空配列は空配列', () => {
    expect(MathHelper.getRunningMin([])).toEqual([]);
  });

  it('1件はそのまま', () => {
    expect(MathHelper.getRunningMin([50])).toEqual([50]);
  });

  it('降順は全て最小値を追跡', () => {
    expect(MathHelper.getRunningMin([30, 20, 10])).toEqual([30, 20, 10]);
  });

  it('昇順は最初の値が維持される', () => {
    expect(MathHelper.getRunningMin([10, 20, 30])).toEqual([10, 10, 10]);
  });

  it('混合パターン', () => {
    expect(MathHelper.getRunningMin([50, 30, 40, 20, 60])).toEqual([50, 30, 30, 20, 20]);
  });

  it('全て同値', () => {
    expect(MathHelper.getRunningMin([50, 50, 50])).toEqual([50, 50, 50]);
  });

  it('結果の長さは入力と同じ', () => {
    const input = [10, 20, 30, 40, 50];
    expect(MathHelper.getRunningMin(input)).toHaveLength(input.length);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => 100 - i);
    const result = MathHelper.getRunningMin(data);
    expect(result[result.length - 1]).toBe(1);
  });
});

describe('MathHelper.getRunningMinLabel', () => {
  it('現在値が最小値と同じなら最低値', () => {
    expect(MathHelper.getRunningMinLabel(10, 10)).toBe('最低値');
  });

  it('現在値が最小値より大きければ最低値以上', () => {
    expect(MathHelper.getRunningMinLabel(50, 10)).toBe('最低値以上');
  });

  it('最小値0で現在値0は最低値', () => {
    expect(MathHelper.getRunningMinLabel(0, 0)).toBe('最低値');
  });
});
