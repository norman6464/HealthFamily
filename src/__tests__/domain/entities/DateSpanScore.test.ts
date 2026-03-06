import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateSpanScore', () => {
  it('0日は0', () => {
    expect(DateRangeHelper.getDateSpanScore(0, 30)).toBe(0);
  });

  it('目標と同じ日数は100', () => {
    expect(DateRangeHelper.getDateSpanScore(30, 30)).toBe(100);
  });

  it('目標以上も100', () => {
    expect(DateRangeHelper.getDateSpanScore(60, 30)).toBe(100);
  });

  it('半分は50', () => {
    expect(DateRangeHelper.getDateSpanScore(15, 30)).toBe(50);
  });

  it('目標0は0', () => {
    expect(DateRangeHelper.getDateSpanScore(10, 0)).toBe(0);
  });

  it('結果は0-100の範囲', () => {
    const result = DateRangeHelper.getDateSpanScore(10, 20);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('日数が多いほどスコアが高い', () => {
    const low = DateRangeHelper.getDateSpanScore(5, 30);
    const high = DateRangeHelper.getDateSpanScore(25, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('1日', () => {
    const result = DateRangeHelper.getDateSpanScore(1, 30);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });
});

describe('DateRangeHelper.getDateSpanScoreLabel', () => {
  it('スコア80以上は十分', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(90)).toBe('十分');
  });

  it('スコア50-80はやや不足', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(60)).toBe('やや不足');
  });

  it('スコア50未満は不足', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(30)).toBe('不足');
  });
});
