import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateRegularityIndex', () => {
  it('空配列は0', () => {
    expect(DateRangeHelper.getDateRegularityIndex([])).toBe(0);
  });

  it('1件は100', () => {
    expect(DateRangeHelper.getDateRegularityIndex([7])).toBe(100);
  });

  it('均等間隔は100', () => {
    expect(DateRangeHelper.getDateRegularityIndex([7, 7, 7, 7])).toBe(100);
  });

  it('ばらつきが大きいと低い', () => {
    const regular = DateRangeHelper.getDateRegularityIndex([7, 7, 7]);
    const irregular = DateRangeHelper.getDateRegularityIndex([1, 14, 3]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('結果は0-100の範囲', () => {
    const result = DateRangeHelper.getDateRegularityIndex([3, 5, 7, 10]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件で同値は100', () => {
    expect(DateRangeHelper.getDateRegularityIndex([10, 10])).toBe(100);
  });

  it('2件で異なる値は100未満', () => {
    const result = DateRangeHelper.getDateRegularityIndex([1, 30]);
    expect(result).toBeLessThan(100);
  });

  it('結果は整数', () => {
    const result = DateRangeHelper.getDateRegularityIndex([5, 8, 3]);
    expect(Number.isInteger(result)).toBe(true);
  });
});

describe('DateRangeHelper.getDateRegularityIndexLabel', () => {
  it('高い値は規則的', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(85)).toBe('規則的');
  });

  it('中程度はやや不規則', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(55)).toBe('やや不規則');
  });

  it('低い値は不規則', () => {
    expect(DateRangeHelper.getDateRegularityIndexLabel(25)).toBe('不規則');
  });
});
