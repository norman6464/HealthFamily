import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getWeekdayConcentration', () => {
  it('空配列は0を返す', () => {
    expect(DateRangeHelper.getWeekdayConcentration([])).toBe(0);
  });

  it('全て同じ曜日は100', () => {
    // 全て月曜日
    expect(DateRangeHelper.getWeekdayConcentration([1, 1, 1, 1])).toBe(100);
  });

  it('7曜日均等分布は低スコア', () => {
    const result = DateRangeHelper.getWeekdayConcentration([0, 1, 2, 3, 4, 5, 6]);
    expect(result).toBeLessThan(30);
  });

  it('2曜日に集中は中程度', () => {
    const result = DateRangeHelper.getWeekdayConcentration([1, 1, 5, 5, 1, 5]);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(80);
  });

  it('1件のみは100', () => {
    expect(DateRangeHelper.getWeekdayConcentration([3])).toBe(100);
  });

  it('0-100の範囲内に収まる', () => {
    const result = DateRangeHelper.getWeekdayConcentration([0, 1, 2, 3, 4, 5, 6, 0, 1]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データで均等分布', () => {
    const days = Array.from({ length: 70 }, (_, i) => i % 7);
    const result = DateRangeHelper.getWeekdayConcentration(days);
    expect(result).toBeLessThan(20);
  });
});

describe('DateRangeHelper.getWeekdayConcentrationLabel', () => {
  it('スコア70以上は集中', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(70)).toBe('集中');
  });

  it('スコア40以上はやや偏り', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(40)).toBe('やや偏り');
  });

  it('スコア40未満は分散', () => {
    expect(DateRangeHelper.getWeekdayConcentrationLabel(20)).toBe('分散');
  });
});
