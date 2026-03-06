import { describe, it, expect } from 'vitest';
import { MathHelper } from '@/domain/entities/MathHelper';

describe('MathHelper.getPowerMean - エッジケース', () => {
  it('空配列は0', () => {
    expect(MathHelper.getPowerMean([], 2)).toBe(0);
  });

  it('p=0は0', () => {
    expect(MathHelper.getPowerMean([1, 2, 3], 0)).toBe(0);
  });

  it('1件でp=1', () => {
    expect(MathHelper.getPowerMean([7], 1)).toBe(7);
  });

  it('1件でp=2', () => {
    expect(MathHelper.getPowerMean([7], 2)).toBe(7);
  });

  it('全て0でp=2', () => {
    expect(MathHelper.getPowerMean([0, 0, 0], 2)).toBe(0);
  });

  it('全て同値でp=3', () => {
    expect(MathHelper.getPowerMean([4, 4, 4], 3)).toBe(4);
  });

  it('p=1は算術平均', () => {
    expect(MathHelper.getPowerMean([10, 20, 30], 1)).toBe(20);
  });

  it('p=2はRMS', () => {
    const rms = MathHelper.getRootMeanSquare([3, 4]);
    const pmean = MathHelper.getPowerMean([3, 4], 2);
    expect(pmean).toBeCloseTo(rms, 1);
  });

  it('大きなpでは最大値に近づく', () => {
    const p1 = MathHelper.getPowerMean([1, 100], 1);
    const p10 = MathHelper.getPowerMean([1, 100], 10);
    expect(p10).toBeGreaterThan(p1);
  });

  it('2件で[1,1]はp任意で1', () => {
    expect(MathHelper.getPowerMean([1, 1], 5)).toBe(1);
  });

  it('大量データ', () => {
    const data = Array(100).fill(10);
    expect(MathHelper.getPowerMean(data, 2)).toBe(10);
  });

  it('結果は0以上', () => {
    const result = MathHelper.getPowerMean([1, 5, 10], 3);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});

describe('MathHelper.getPowerMeanLabel - エッジケース', () => {
  it('0は低い', () => {
    expect(MathHelper.getPowerMeanLabel(0)).toBe('低い');
  });

  it('29は低い', () => {
    expect(MathHelper.getPowerMeanLabel(29)).toBe('低い');
  });

  it('30は中程度', () => {
    expect(MathHelper.getPowerMeanLabel(30)).toBe('中程度');
  });

  it('69は中程度', () => {
    expect(MathHelper.getPowerMeanLabel(69)).toBe('中程度');
  });

  it('70は高い', () => {
    expect(MathHelper.getPowerMeanLabel(70)).toBe('高い');
  });

  it('100は高い', () => {
    expect(MathHelper.getPowerMeanLabel(100)).toBe('高い');
  });
});
