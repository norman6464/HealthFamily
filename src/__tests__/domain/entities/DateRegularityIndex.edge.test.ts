import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateRegularityIndex エッジケース', () => {
  it('全て0の間隔は0', () => {
    expect(DateRangeHelper.getDateRegularityIndex([0, 0, 0])).toBe(0);
  });

  it('負の間隔を含む場合', () => {
    const result = DateRangeHelper.getDateRegularityIndex([-1, 7, 7]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('非常に大きな間隔', () => {
    expect(DateRangeHelper.getDateRegularityIndex([365, 365, 365])).toBe(100);
  });

  it('小数の間隔', () => {
    const result = DateRangeHelper.getDateRegularityIndex([7.5, 7.5, 7.5]);
    expect(result).toBe(100);
  });

  it('多数の要素', () => {
    const intervals = Array.from({ length: 52 }, () => 7);
    expect(DateRangeHelper.getDateRegularityIndex(intervals)).toBe(100);
  });

  it('交互に異なる間隔', () => {
    const result = DateRangeHelper.getDateRegularityIndex([1, 14, 1, 14, 1, 14]);
    expect(result).toBeLessThan(50);
  });

  it('徐々に増加する間隔', () => {
    const result = DateRangeHelper.getDateRegularityIndex([1, 2, 3, 4, 5]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1つだけ外れ値', () => {
    const regular = DateRangeHelper.getDateRegularityIndex([7, 7, 7, 7]);
    const withOutlier = DateRangeHelper.getDateRegularityIndex([7, 7, 7, 100]);
    expect(regular).toBeGreaterThan(withOutlier);
  });

  it('2件で大きな差', () => {
    const result = DateRangeHelper.getDateRegularityIndex([1, 100]);
    expect(result).toBeLessThan(50);
  });

  it('結果は整数', () => {
    const result = DateRangeHelper.getDateRegularityIndex([3, 5, 7]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('3件で均等は100', () => {
    expect(DateRangeHelper.getDateRegularityIndex([14, 14, 14])).toBe(100);
  });

  it('ほぼ均等な間隔は高スコア', () => {
    const result = DateRangeHelper.getDateRegularityIndex([7, 7, 7, 8]);
    expect(result).toBeGreaterThan(90);
  });
});

describe('DateRangeHelper.getDateRegularityIndexLabel エッジケース', () => {
  it('境界値80は規則的', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(80)).toBe('規則的');
  });

  it('境界値50はやや不規則', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(50)).toBe('やや不規則');
  });

  it('境界値79はやや不規則', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(79)).toBe('やや不規則');
  });

  it('境界値49は不規則', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(49)).toBe('不規則');
  });

  it('0は不規則', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(0)).toBe('不規則');
  });

  it('100は規則的', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(100)).toBe('規則的');
  });
});
