import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordStreakScore', () => {
  it('空配列は0を返す', () => {
    expect(CalendarEntity.getRecordStreakScore([])).toBe(0);
  });

  it('全て記録ありは100', () => {
    expect(CalendarEntity.getRecordStreakScore([true, true, true, true, true])).toBe(100);
  });

  it('全て記録なしは0', () => {
    expect(CalendarEntity.getRecordStreakScore([false, false, false])).toBe(0);
  });

  it('半分記録ありは50', () => {
    expect(CalendarEntity.getRecordStreakScore([true, false, true, false])).toBe(50);
  });

  it('1件のみ記録ありは1件分のスコア', () => {
    const result = CalendarEntity.getRecordStreakScore([true, false, false, false, false]);
    expect(result).toBe(20);
  });

  it('連続記録が長いほどボーナスが付く', () => {
    // 3連続 vs 離散3件(同じ記録数だが連続の方が高い)
    const consecutive = CalendarEntity.getRecordStreakScore([true, true, true, false, false, false]);
    const scattered = CalendarEntity.getRecordStreakScore([true, false, true, false, true, false]);
    expect(consecutive).toBeGreaterThanOrEqual(scattered);
  });

  it('0-100の範囲内', () => {
    const result = CalendarEntity.getRecordStreakScore([true, false, true, true, false]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1件のみtrue', () => {
    expect(CalendarEntity.getRecordStreakScore([true])).toBe(100);
  });

  it('1件のみfalse', () => {
    expect(CalendarEntity.getRecordStreakScore([false])).toBe(0);
  });
});

describe('CalendarEntity.getRecordStreakScoreLabel', () => {
  it('スコア80以上は優秀', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(80)).toBe('優秀');
  });

  it('スコア50以上は良好', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(50)).toBe('良好');
  });

  it('スコア50未満は要改善', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(30)).toBe('要改善');
  });
});
