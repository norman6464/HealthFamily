import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper.getWeekendRatio - エッジケース', () => {
  it('空配列は0', () => {
    expect(DateRangeHelper.getWeekendRatio([])).toBe(0);
  });

  it('1件の平日は0', () => {
    expect(DateRangeHelper.getWeekendRatio([1])).toBe(0);
  });

  it('1件の日曜は100', () => {
    expect(DateRangeHelper.getWeekendRatio([0])).toBe(100);
  });

  it('1件の土曜は100', () => {
    expect(DateRangeHelper.getWeekendRatio([6])).toBe(100);
  });

  it('全て月曜は0', () => {
    expect(DateRangeHelper.getWeekendRatio([1, 1, 1, 1])).toBe(0);
  });

  it('全て日曜は100', () => {
    expect(DateRangeHelper.getWeekendRatio([0, 0, 0])).toBe(100);
  });

  it('全て土曜は100', () => {
    expect(DateRangeHelper.getWeekendRatio([6, 6, 6])).toBe(100);
  });

  it('平日5日+休日2日は29', () => {
    expect(DateRangeHelper.getWeekendRatio([1, 2, 3, 4, 5, 0, 6])).toBe(29);
  });

  it('結果は0-100', () => {
    const result = DateRangeHelper.getWeekendRatio([0, 1, 3, 6, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('半々は50', () => {
    expect(DateRangeHelper.getWeekendRatio([0, 6, 1, 2])).toBe(50);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => i % 7);
    const result = DateRangeHelper.getWeekendRatio(data);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('全曜日を含む', () => {
    const result = DateRangeHelper.getWeekendRatio([0, 1, 2, 3, 4, 5, 6]);
    expect(result).toBe(29);
  });

  it('休日のみ2件', () => {
    expect(DateRangeHelper.getWeekendRatio([0, 6])).toBe(100);
  });

  it('平日のみ2件', () => {
    expect(DateRangeHelper.getWeekendRatio([1, 5])).toBe(0);
  });

  it('3件中1件休日', () => {
    expect(DateRangeHelper.getWeekendRatio([0, 1, 2])).toBe(33);
  });
});

describe('DateRangeHelper.getWeekendRatioLabel - 境界値', () => {
  it('比率0は平日中心', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(0)).toBe('平日中心');
  });

  it('比率19は平日中心', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(19)).toBe('平日中心');
  });

  it('比率20は均等(境界値)', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(20)).toBe('均等');
  });

  it('比率39は均等', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(39)).toBe('均等');
  });

  it('比率40は休日中心(境界値)', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(40)).toBe('休日中心');
  });

  it('比率100は休日中心', () => {
    expect(DateRangeHelper.getWeekendRatioLabel(100)).toBe('休日中心');
  });
});
