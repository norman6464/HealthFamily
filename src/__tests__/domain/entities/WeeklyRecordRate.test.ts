import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getWeeklyRecordRate', () => {
  it('空配列は0', () => {
    expect(CalendarEntity.getWeeklyRecordRate([])).toBe(0);
  });

  it('全て記録ありは100', () => {
    expect(CalendarEntity.getWeeklyRecordRate([1, 1, 1, 1, 1, 1, 1])).toBe(100);
  });

  it('全て0は0', () => {
    expect(CalendarEntity.getWeeklyRecordRate([0, 0, 0, 0, 0, 0, 0])).toBe(0);
  });

  it('半分記録あり', () => {
    const result = CalendarEntity.getWeeklyRecordRate([1, 0, 1, 0, 1, 0, 0]);
    expect(result).toBe(43);
  });

  it('1日だけ記録あり', () => {
    const result = CalendarEntity.getWeeklyRecordRate([0, 0, 0, 1, 0, 0, 0]);
    expect(result).toBe(14);
  });

  it('7日以上でも対応', () => {
    const result = CalendarEntity.getWeeklyRecordRate([1, 1, 1, 0, 0, 0, 0, 1, 1, 1]);
    expect(result).toBe(60);
  });

  it('結果は0-100の範囲', () => {
    const result = CalendarEntity.getWeeklyRecordRate([1, 0, 1, 1, 0]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('記録数が多いほどスコアが高い', () => {
    const low = CalendarEntity.getWeeklyRecordRate([1, 0, 0, 0, 0, 0, 0]);
    const high = CalendarEntity.getWeeklyRecordRate([1, 1, 1, 1, 1, 0, 0]);
    expect(high).toBeGreaterThan(low);
  });

  it('複数回の記録も1日として数える', () => {
    expect(CalendarEntity.getWeeklyRecordRate([3, 2, 0, 0, 0, 0, 0])).toBe(29);
  });
});

describe('CalendarEntity.getWeeklyRecordRateLabel', () => {
  it('率高は毎日記録', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(90)).toBe('毎日記録');
  });

  it('率中はまずまず', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(60)).toBe('まずまず');
  });

  it('率低は記録不足', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(30)).toBe('記録不足');
  });
});
