import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getCalendarDensity - エッジケース', () => {
  it('記録0・日数0は0', () => {
    expect(CalendarEntity.getCalendarDensity(0, 0)).toBe(0);
  });

  it('記録0・日数30は0', () => {
    expect(CalendarEntity.getCalendarDensity(0, 30)).toBe(0);
  });

  it('記録10・日数0は0', () => {
    expect(CalendarEntity.getCalendarDensity(10, 0)).toBe(0);
  });

  it('記録30・日数30は100', () => {
    expect(CalendarEntity.getCalendarDensity(30, 30)).toBe(100);
  });

  it('記録1・日数1は100', () => {
    expect(CalendarEntity.getCalendarDensity(1, 1)).toBe(100);
  });

  it('超過しても100以下', () => {
    expect(CalendarEntity.getCalendarDensity(50, 30)).toBeLessThanOrEqual(100);
  });

  it('半分は50', () => {
    expect(CalendarEntity.getCalendarDensity(15, 30)).toBe(50);
  });

  it('1/3は33', () => {
    expect(CalendarEntity.getCalendarDensity(10, 30)).toBe(33);
  });

  it('記録が多いほどスコアが高い', () => {
    const low = CalendarEntity.getCalendarDensity(5, 30);
    const high = CalendarEntity.getCalendarDensity(25, 30);
    expect(high).toBeGreaterThan(low);
  });

  it('日数が多いほどスコアが低い', () => {
    const low = CalendarEntity.getCalendarDensity(10, 30);
    const high = CalendarEntity.getCalendarDensity(10, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = CalendarEntity.getCalendarDensity(12, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('負の日数は0', () => {
    expect(CalendarEntity.getCalendarDensity(5, -10)).toBe(0);
  });
});

describe('CalendarEntity.getCalendarDensityLabel - エッジケース', () => {
  it('100は高密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(100)).toBe('高密度');
  });

  it('80は高密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(80)).toBe('高密度');
  });

  it('79は中密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(79)).toBe('中密度');
  });

  it('50は中密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(50)).toBe('中密度');
  });

  it('49は低密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(49)).toBe('低密度');
  });

  it('0は低密度', () => {
    expect(CalendarEntity.getCalendarDensityLabel(0)).toBe('低密度');
  });
});
