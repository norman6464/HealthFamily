import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordStreakScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(CalendarEntity.getRecordStreakScore([])).toBe(0);
  });

  it('1件true', () => {
    expect(CalendarEntity.getRecordStreakScore([true])).toBe(100);
  });

  it('1件false', () => {
    expect(CalendarEntity.getRecordStreakScore([false])).toBe(0);
  });

  it('全てtrue(長い配列)', () => {
    expect(CalendarEntity.getRecordStreakScore(Array(30).fill(true))).toBe(100);
  });

  it('全てfalse(長い配列)', () => {
    expect(CalendarEntity.getRecordStreakScore(Array(30).fill(false))).toBe(0);
  });

  it('交互パターン', () => {
    const pattern = Array.from({ length: 10 }, (_, i) => i % 2 === 0);
    expect(CalendarEntity.getRecordStreakScore(pattern)).toBe(50);
  });

  it('最初だけtrue', () => {
    expect(CalendarEntity.getRecordStreakScore([true, false, false, false, false])).toBe(20);
  });

  it('最後だけtrue', () => {
    expect(CalendarEntity.getRecordStreakScore([false, false, false, false, true])).toBe(20);
  });

  it('中間だけtrue', () => {
    expect(CalendarEntity.getRecordStreakScore([false, false, true, false, false])).toBe(20);
  });

  it('2件中1件true', () => {
    expect(CalendarEntity.getRecordStreakScore([true, false])).toBe(50);
  });

  it('3件中2件true', () => {
    expect(CalendarEntity.getRecordStreakScore([true, true, false])).toBe(67);
  });

  it('3件中1件true', () => {
    expect(CalendarEntity.getRecordStreakScore([false, true, false])).toBe(33);
  });

  it('0-100の範囲内', () => {
    const result = CalendarEntity.getRecordStreakScore([true, false, true, true, false, true]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データでも正常に処理', () => {
    const data = Array.from({ length: 365 }, (_, i) => i % 3 !== 0);
    const result = CalendarEntity.getRecordStreakScore(data);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('CalendarEntity.getRecordStreakScoreLabel - 境界値', () => {
  it('スコア80は優秀(境界値)', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(80)).toBe('優秀');
  });

  it('スコア79は良好', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(79)).toBe('良好');
  });

  it('スコア50は良好(境界値)', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(50)).toBe('良好');
  });

  it('スコア49は要改善', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(49)).toBe('要改善');
  });

  it('スコア0は要改善', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(0)).toBe('要改善');
  });

  it('スコア100は優秀', () => {
    expect(CalendarEntity.getRecordStreakScoreLabel(100)).toBe('優秀');
  });
});
