import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getWeeklyRecordRate - エッジケース', () => {
  it('空配列は0', () => {
    expect(CalendarEntity.getWeeklyRecordRate([])).toBe(0);
  });

  it('1日のみ記録ありは100', () => {
    expect(CalendarEntity.getWeeklyRecordRate([1])).toBe(100);
  });

  it('1日のみ記録なしは0', () => {
    expect(CalendarEntity.getWeeklyRecordRate([0])).toBe(0);
  });

  it('全て記録ありは100', () => {
    expect(CalendarEntity.getWeeklyRecordRate([1, 2, 3, 1, 1, 1, 1])).toBe(100);
  });

  it('全て0は0', () => {
    expect(CalendarEntity.getWeeklyRecordRate([0, 0, 0, 0, 0, 0, 0])).toBe(0);
  });

  it('1日だけ記録あり(7日中)', () => {
    expect(CalendarEntity.getWeeklyRecordRate([0, 0, 0, 0, 0, 0, 1])).toBe(14);
  });

  it('6日記録あり(7日中)', () => {
    expect(CalendarEntity.getWeeklyRecordRate([1, 1, 1, 1, 1, 1, 0])).toBe(86);
  });

  it('複数回の記録も1日として数える', () => {
    expect(CalendarEntity.getWeeklyRecordRate([5, 0])).toBe(50);
  });

  it('大量データ', () => {
    const data = Array(100).fill(1);
    expect(CalendarEntity.getWeeklyRecordRate(data)).toBe(100);
  });

  it('大量データ半分0', () => {
    const data = Array(100).fill(0).map((_, i) => (i % 2 === 0 ? 1 : 0));
    expect(CalendarEntity.getWeeklyRecordRate(data)).toBe(50);
  });

  it('結果は0-100の範囲', () => {
    const result = CalendarEntity.getWeeklyRecordRate([1, 0, 1, 0, 1]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('記録数が多いほどスコアが高い', () => {
    const low = CalendarEntity.getWeeklyRecordRate([1, 0, 0, 0, 0, 0, 0]);
    const high = CalendarEntity.getWeeklyRecordRate([1, 1, 1, 1, 1, 0, 0]);
    expect(high).toBeGreaterThan(low);
  });
});

describe('CalendarEntity.getWeeklyRecordRateLabel - エッジケース', () => {
  it('率100は毎日記録', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(100)).toBe('毎日記録');
  });

  it('率80は毎日記録', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(80)).toBe('毎日記録');
  });

  it('率79はまずまず', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(79)).toBe('まずまず');
  });

  it('率50はまずまず', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(50)).toBe('まずまず');
  });

  it('率49は記録不足', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(49)).toBe('記録不足');
  });

  it('率0は記録不足', () => {
    expect(CalendarEntity.getWeeklyRecordRateLabel(0)).toBe('記録不足');
  });
});
