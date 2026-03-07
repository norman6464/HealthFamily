import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateRegularityScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(DateRangeHelper.getDateRegularityScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(DateRangeHelper.getDateRegularityScore([14])).toBe(100);
  });

  it('全て同じは100', () => {
    expect(DateRangeHelper.getDateRegularityScore([7, 7, 7, 7])).toBe(100);
  });

  it('2件同値は100', () => {
    expect(DateRangeHelper.getDateRegularityScore([30, 30])).toBe(100);
  });

  it('全て0は0', () => {
    expect(DateRangeHelper.getDateRegularityScore([0, 0, 0])).toBe(0);
  });

  it('わずかなばらつき', () => {
    const result = DateRangeHelper.getDateRegularityScore([6, 7, 8]);
    expect(result).toBeGreaterThan(85);
  });

  it('大きなばらつき', () => {
    const result = DateRangeHelper.getDateRegularityScore([1, 100]);
    expect(result).toBeLessThan(50);
  });

  it('均一なほどスコアが高い', () => {
    const regular = DateRangeHelper.getDateRegularityScore([10, 10, 10]);
    const irregular = DateRangeHelper.getDateRegularityScore([1, 10, 50]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('結果は0-100の範囲', () => {
    const result = DateRangeHelper.getDateRegularityScore([3, 7, 14, 21]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データで均一', () => {
    const data = Array(50).fill(7);
    expect(DateRangeHelper.getDateRegularityScore(data)).toBe(100);
  });
});

describe('DateRangeHelper.getDateRegularityScoreLabel - エッジケース', () => {
  it('100は規則的', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(100)).toBe('規則的');
  });

  it('80は規則的', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(80)).toBe('規則的');
  });

  it('79はやや不規則', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(79)).toBe('やや不規則');
  });

  it('50はやや不規則', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(50)).toBe('やや不規則');
  });

  it('49は不規則', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(49)).toBe('不規則');
  });

  it('0は不規則', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(0)).toBe('不規則');
  });
});
