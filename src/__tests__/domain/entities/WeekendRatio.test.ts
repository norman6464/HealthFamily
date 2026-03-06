import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getWeekendRatio', () => {
  it('空配列は0', () => {
    expect(DateRangeHelper.getWeekendRatio([])).toBe(0);
  });

  it('全て平日は0', () => {
    // 1=月, 2=火, 3=水, 4=木, 5=金
    expect(DateRangeHelper.getWeekendRatio([1, 2, 3, 4, 5])).toBe(0);
  });

  it('全て休日は100', () => {
    // 0=日, 6=土
    expect(DateRangeHelper.getWeekendRatio([0, 6, 0, 6])).toBe(100);
  });

  it('7日間の通常週は約29', () => {
    const result = DateRangeHelper.getWeekendRatio([0, 1, 2, 3, 4, 5, 6]);
    expect(result).toBe(29);
  });

  it('結果は0-100', () => {
    const result = DateRangeHelper.getWeekendRatio([0, 1, 2, 6]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('休日が多いほどスコアが高い', () => {
    const few = DateRangeHelper.getWeekendRatio([0, 1, 2, 3, 4]);
    const many = DateRangeHelper.getWeekendRatio([0, 6, 0, 1, 2]);
    expect(many).toBeGreaterThan(few);
  });
});

describe('DateRangeHelper.getWeekendRatioLabel', () => {
  it('休日率40以上は休日中心', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(50)).toBe('休日中心');
  });

  it('休日率20-40は均等', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(30)).toBe('均等');
  });

  it('休日率20未満は平日中心', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(10)).toBe('平日中心');
  });
});
