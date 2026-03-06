import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getDateSpanScore - エッジケース', () => {
  it('両方0は0', () => {
    expect(DateRangeHelper.getDateSpanScore(0, 0)).toBe(0);
  });

  it('日数0・目標ありは0', () => {
    expect(DateRangeHelper.getDateSpanScore(0, 30)).toBe(0);
  });

  it('日数あり・目標0は0', () => {
    expect(DateRangeHelper.getDateSpanScore(10, 0)).toBe(0);
  });

  it('1日/30日', () => {
    expect(DateRangeHelper.getDateSpanScore(1, 30)).toBe(3);
  });

  it('ちょうど目標は100', () => {
    expect(DateRangeHelper.getDateSpanScore(30, 30)).toBe(100);
  });

  it('目標の2倍も100', () => {
    expect(DateRangeHelper.getDateSpanScore(60, 30)).toBe(100);
  });

  it('1/1は100', () => {
    expect(DateRangeHelper.getDateSpanScore(1, 1)).toBe(100);
  });

  it('大きな値', () => {
    expect(DateRangeHelper.getDateSpanScore(365, 365)).toBe(100);
  });

  it('日数が多いほどスコアが高い', () => {
    const low = DateRangeHelper.getDateSpanScore(5, 30);
    const high = DateRangeHelper.getDateSpanScore(25, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = DateRangeHelper.getDateSpanScore(15, 20);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('負の日数は0', () => {
    expect(DateRangeHelper.getDateSpanScore(-5, 30)).toBe(0);
  });

  it('負の目標は0', () => {
    expect(DateRangeHelper.getDateSpanScore(10, -30)).toBe(0);
  });
});

describe('DateRangeHelper.getDateSpanScoreLabel - エッジケース', () => {
  it('スコア100は十分', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(100)).toBe('十分');
  });

  it('スコア80は十分', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(80)).toBe('十分');
  });

  it('スコア79はやや不足', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(79)).toBe('やや不足');
  });

  it('スコア50はやや不足', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(50)).toBe('やや不足');
  });

  it('スコア49は不足', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(49)).toBe('不足');
  });

  it('スコア0は不足', () => {
    expect(DateRangeHelper.getDateSpanScoreLabel(0)).toBe('不足');
  });
});
