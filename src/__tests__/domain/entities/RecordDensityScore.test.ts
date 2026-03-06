import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordDensityScore', () => {
  it('記録日0は0を返す', () => {
    expect(CalendarEntity.getRecordDensityScore(0, 30)).toBe(0);
  });

  it('期間0は0を返す', () => {
    expect(CalendarEntity.getRecordDensityScore(10, 0)).toBe(0);
  });

  it('全日記録は100', () => {
    expect(CalendarEntity.getRecordDensityScore(30, 30)).toBe(100);
  });

  it('半分記録は50', () => {
    expect(CalendarEntity.getRecordDensityScore(15, 30)).toBe(50);
  });

  it('記録日が期間を超えても100を超えない', () => {
    expect(CalendarEntity.getRecordDensityScore(40, 30)).toBe(100);
  });

  it('0-100の範囲内', () => {
    const result = CalendarEntity.getRecordDensityScore(10, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1日記録/30日は約3', () => {
    expect(CalendarEntity.getRecordDensityScore(1, 30)).toBe(3);
  });
});

describe('CalendarEntity.getRecordDensityScoreLabel', () => {
  it('スコア80以上は高密度', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(85)).toBe('高密度');
  });

  it('スコア50以上は中密度', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(60)).toBe('中密度');
  });

  it('スコア50未満は低密度', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(30)).toBe('低密度');
  });
});
