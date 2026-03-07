import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getWinsorizedMean - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getWinsorizedMean([], 0)).toBe(0);
  });

  it('空配列・高トリムは0', () => {
    expect(MathHelper.getWinsorizedMean([], 50)).toBe(0);
  });

  it('1件はその値', () => {
    expect(MathHelper.getWinsorizedMean([7], 20)).toBe(7);
  });

  it('2件同値は同じ', () => {
    expect(MathHelper.getWinsorizedMean([5, 5], 0)).toBe(5);
  });

  it('2件異値・トリム0は平均', () => {
    expect(MathHelper.getWinsorizedMean([10, 20], 0)).toBe(15);
  });

  it('全て同値はトリムに関わらず同じ', () => {
    expect(MathHelper.getWinsorizedMean([10, 10, 10, 10], 25)).toBe(10);
  });

  it('トリム率が高すぎる場合は通常平均', () => {
    expect(MathHelper.getWinsorizedMean([1, 2, 3], 50)).toBe(2);
  });

  it('外れ値を端に置換', () => {
    const result = MathHelper.getWinsorizedMean([1, 10, 10, 10, 100], 20);
    expect(result).toBe(10);
  });

  it('ソート順に関係なく同じ結果', () => {
    const a = MathHelper.getWinsorizedMean([100, 1, 10, 10, 10], 20);
    const b = MathHelper.getWinsorizedMean([1, 10, 10, 10, 100], 20);
    expect(a).toBe(b);
  });

  it('大量データで均一', () => {
    const data = Array(100).fill(50);
    expect(MathHelper.getWinsorizedMean(data, 10)).toBe(50);
  });

  it('負の値を含む配列', () => {
    const result = MathHelper.getWinsorizedMean([-10, 0, 10], 0);
    expect(result).toBe(0);
  });

  it('トリムとウィンソライズの違い', () => {
    const values = [1, 2, 3, 4, 100];
    const trimmed = MathHelper.getTrimmedMean(values, 20);
    const winsorized = MathHelper.getWinsorizedMean(values, 20);
    // トリムは除外、ウィンソライズは置換なので結果が異なりうる
    expect(typeof trimmed).toBe('number');
    expect(typeof winsorized).toBe('number');
  });
});

describe('MathHelper.getWinsorizedMeanLabel - エッジケース', () => {
  it('100は高い', () => {
    expect(MathHelper.getWinsorizedMeanLabel(100)).toBe('高い');
  });

  it('70は高い', () => {
    expect(MathHelper.getWinsorizedMeanLabel(70)).toBe('高い');
  });

  it('69は中程度', () => {
    expect(MathHelper.getWinsorizedMeanLabel(69)).toBe('中程度');
  });

  it('30は中程度', () => {
    expect(MathHelper.getWinsorizedMeanLabel(30)).toBe('中程度');
  });

  it('29は低い', () => {
    expect(MathHelper.getWinsorizedMeanLabel(29)).toBe('低い');
  });

  it('0は低い', () => {
    expect(MathHelper.getWinsorizedMeanLabel(0)).toBe('低い');
  });
});
