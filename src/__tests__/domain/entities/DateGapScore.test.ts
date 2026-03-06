import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateGapScore', () => {
  it('空配列は0を返す', () => {
    expect(DateRangeHelper.getDateGapScore([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(DateRangeHelper.getDateGapScore([1])).toBe(0);
  });

  it('全て等間隔は100', () => {
    expect(DateRangeHelper.getDateGapScore([1, 1, 1, 1])).toBe(100);
  });

  it('ばらつきがあると100未満', () => {
    const result = DateRangeHelper.getDateGapScore([1, 5, 2, 10]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('全て同じ間隔は100', () => {
    expect(DateRangeHelper.getDateGapScore([7, 7, 7])).toBe(100);
  });

  it('大きなばらつきは低スコア', () => {
    const small = DateRangeHelper.getDateGapScore([5, 6, 5, 6]);
    const large = DateRangeHelper.getDateGapScore([1, 30, 1, 30]);
    expect(small).toBeGreaterThan(large);
  });

  it('0-100の範囲内', () => {
    const result = DateRangeHelper.getDateGapScore([1, 100, 1]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('DateRangeHelper.getDateGapScoreLabel', () => {
  it('スコア80以上は規則的', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(85)).toBe('規則的');
  });

  it('スコア50以上はやや不規則', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(60)).toBe('やや不規則');
  });

  it('スコア50未満は不規則', () => {
    expect(DateRangeHelper.getDateGapScoreLabel(30)).toBe('不規則');
  });
});
