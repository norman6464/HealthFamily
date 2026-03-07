import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getCalendarDensity', () => {
  it('全て0は0', () => {
    expect(CalendarEntity.getCalendarDensity(0, 30)).toBe(0);
  });

  it('全日記録は100', () => {
    expect(CalendarEntity.getCalendarDensity(30, 30)).toBe(100);
  });

  it('日数0は0', () => {
    expect(CalendarEntity.getCalendarDensity(10, 0)).toBe(0);
  });

  it('半分は50', () => {
    expect(CalendarEntity.getCalendarDensity(15, 30)).toBe(50);
  });

  it('記録日が多いほどスコアが高い', () => {
    const low = CalendarEntity.getCalendarDensity(5, 30);
    const high = CalendarEntity.getCalendarDensity(25, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = CalendarEntity.getCalendarDensity(10, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('超過しても100以下', () => {
    expect(CalendarEntity.getCalendarDensity(40, 30)).toBeLessThanOrEqual(100);
  });
});

describe('CalendarEntity.getCalendarDensityLabel', () => {
  it('スコア高は高密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(85)).toBe('高密度');
  });

  it('スコア中は中密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(55)).toBe('中密度');
  });

  it('スコア低は低密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(25)).toBe('低密度');
  });
});
