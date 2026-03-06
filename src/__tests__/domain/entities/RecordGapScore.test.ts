import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordGapScore', () => {
  it('空配列は0', () => {
    expect(CalendarEntity.getRecordGapScore([])).toBe(0);
  });

  it('全て記録ありは100', () => {
    expect(CalendarEntity.getRecordGapScore([1, 2, 3, 1, 2])).toBe(100);
  });

  it('全て0は0', () => {
    expect(CalendarEntity.getRecordGapScore([0, 0, 0, 0])).toBe(0);
  });

  it('半分記録ありは50', () => {
    expect(CalendarEntity.getRecordGapScore([1, 0, 1, 0])).toBe(50);
  });

  it('1件のみ記録あり', () => {
    expect(CalendarEntity.getRecordGapScore([0, 0, 1, 0, 0])).toBe(20);
  });

  it('1件のみ', () => {
    expect(CalendarEntity.getRecordGapScore([3])).toBe(100);
  });

  it('0の1件のみ', () => {
    expect(CalendarEntity.getRecordGapScore([0])).toBe(0);
  });

  it('結果は0-100の範囲', () => {
    const result = CalendarEntity.getRecordGapScore([1, 0, 2, 0, 3]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('記録が多いほどスコアが高い', () => {
    const low = CalendarEntity.getRecordGapScore([1, 0, 0, 0, 0]);
    const high = CalendarEntity.getRecordGapScore([1, 1, 1, 1, 0]);
    expect(high).toBeGreaterThan(low);
  });
});

describe('CalendarEntity.getRecordGapScoreLabel', () => {
  it('スコア80以上は良好', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(90)).toBe('良好');
  });

  it('スコア50-80はまずまず', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(60)).toBe('まずまず');
  });

  it('スコア50未満は空白多い', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(30)).toBe('空白多い');
  });
});
