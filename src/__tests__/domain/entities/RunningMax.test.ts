import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getRunningMax', () => {
  it('空配列は空配列を返す', () => {
    expect(MathHelper.getRunningMax([])).toEqual([]);
  });

  it('1要素はそのまま返す', () => {
    expect(MathHelper.getRunningMax([50])).toEqual([50]);
  });

  it('昇順は各位置の値がそのまま最大', () => {
    expect(MathHelper.getRunningMax([10, 20, 30])).toEqual([10, 20, 30]);
  });

  it('降順は最初の値が全て最大', () => {
    expect(MathHelper.getRunningMax([30, 20, 10])).toEqual([30, 30, 30]);
  });

  it('途中で最大値が更新される', () => {
    expect(MathHelper.getRunningMax([10, 30, 20, 40])).toEqual([10, 30, 30, 40]);
  });

  it('全て同じ値', () => {
    expect(MathHelper.getRunningMax([50, 50, 50])).toEqual([50, 50, 50]);
  });

  it('負の値も正しく処理', () => {
    expect(MathHelper.getRunningMax([-30, -20, -10])).toEqual([-30, -20, -10]);
  });

  it('0を含む配列', () => {
    expect(MathHelper.getRunningMax([0, 5, 3, 8])).toEqual([0, 5, 5, 8]);
  });

  it('結果の長さは入力と同じ', () => {
    const result = MathHelper.getRunningMax([1, 2, 3, 4, 5]);
    expect(result).toHaveLength(5);
  });
});

describe('MathHelper.getRunningMaxLabel', () => {
  it('現在値が最大値と同じなら最高値', () => {
    expect(MathHelper.getRunningMaxLabel(100, 100)).toBe('最高値');
  });

  it('現在値が最大値の90%以上なら最高値付近', () => {
    expect(MathHelper.getRunningMaxLabel(91, 100)).toBe('最高値付近');
  });

  it('現在値が最大値の90%未満なら最高値以下', () => {
    expect(MathHelper.getRunningMaxLabel(80, 100)).toBe('最高値以下');
  });
});
