import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateRegularityScore', () => {
  it('空配列は0', () => {
    expect(DateRangeHelper.getDateRegularityScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(DateRangeHelper.getDateRegularityScore([7])).toBe(100);
  });

  it('全て同じ間隔は100', () => {
    expect(DateRangeHelper.getDateRegularityScore([7, 7, 7])).toBe(100);
  });

  it('ばらつきがあるとスコアが下がる', () => {
    const result = DateRangeHelper.getDateRegularityScore([3, 10, 20]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });

  it('均一なほどスコアが高い', () => {
    const regular = DateRangeHelper.getDateRegularityScore([7, 7, 7]);
    const irregular = DateRangeHelper.getDateRegularityScore([1, 7, 20]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('結果は0-100の範囲', () => {
    const result = DateRangeHelper.getDateRegularityScore([5, 10, 15]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件で同値は100', () => {
    expect(DateRangeHelper.getDateRegularityScore([14, 14])).toBe(100);
  });
});

describe('DateRangeHelper.getDateRegularityScoreLabel', () => {
  it('スコア高は規則的', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(85)).toBe('規則的');
  });

  it('スコア中はやや不規則', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(55)).toBe('やや不規則');
  });

  it('スコア低は不規則', () => {
    expect(DateRangeHelper.getDateRegularityScoreLabel(25)).toBe('不規則');
  });
});
