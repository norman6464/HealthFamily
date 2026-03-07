import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getTrimmedMean - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getTrimmedMean([], 0)).toBe(0);
  });

  it('空配列・トリム50は0', () => {
    expect(MathHelper.getTrimmedMean([], 50)).toBe(0);
  });

  it('1件・トリム0はその値', () => {
    expect(MathHelper.getTrimmedMean([7], 0)).toBe(7);
  });

  it('1件・トリム50はその値', () => {
    expect(MathHelper.getTrimmedMean([7], 50)).toBe(7);
  });

  it('2件同値・トリム0', () => {
    expect(MathHelper.getTrimmedMean([5, 5], 0)).toBe(5);
  });

  it('2件異値・トリム0', () => {
    expect(MathHelper.getTrimmedMean([10, 20], 0)).toBe(15);
  });

  it('トリム率が高すぎる場合は通常平均', () => {
    expect(MathHelper.getTrimmedMean([1, 2, 3], 50)).toBe(2);
  });

  it('全て同値はトリムに関わらず同じ', () => {
    expect(MathHelper.getTrimmedMean([10, 10, 10, 10, 10], 20)).toBe(10);
  });

  it('ソート順に関係なく結果が同じ', () => {
    const a = MathHelper.getTrimmedMean([1, 5, 3, 4, 2], 20);
    const b = MathHelper.getTrimmedMean([5, 4, 3, 2, 1], 20);
    expect(a).toBe(b);
  });

  it('大量データで均一', () => {
    const data = Array(100).fill(50);
    expect(MathHelper.getTrimmedMean(data, 10)).toBe(50);
  });

  it('外れ値除外で中央に近づく', () => {
    const values = [1, 50, 50, 50, 50, 50, 50, 50, 50, 100];
    const trimmed = MathHelper.getTrimmedMean(values, 10);
    expect(trimmed).toBe(50);
  });

  it('負の値を含む配列', () => {
    const result = MathHelper.getTrimmedMean([-10, 0, 10], 0);
    expect(result).toBe(0);
  });

  it('小数値の結果', () => {
    const result = MathHelper.getTrimmedMean([1, 2, 3, 4], 0);
    expect(result).toBe(2.5);
  });
});

describe('MathHelper.getTrimmedMeanLabel - エッジケース', () => {
  it('100は高い', () => {
    expect(MathHelper.getTrimmedMeanLabel(100)).toBe('高い');
  });

  it('70は高い', () => {
    expect(MathHelper.getTrimmedMeanLabel(70)).toBe('高い');
  });

  it('69は中程度', () => {
    expect(MathHelper.getTrimmedMeanLabel(69)).toBe('中程度');
  });

  it('30は中程度', () => {
    expect(MathHelper.getTrimmedMeanLabel(30)).toBe('中程度');
  });

  it('29は低い', () => {
    expect(MathHelper.getTrimmedMeanLabel(29)).toBe('低い');
  });

  it('0は低い', () => {
    expect(MathHelper.getTrimmedMeanLabel(0)).toBe('低い');
  });
});
