import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordFrequencyScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(CalendarEntity.getRecordFrequencyScore([])).toBe(0);
  });

  it('1件の0は0', () => {
    expect(CalendarEntity.getRecordFrequencyScore([0])).toBe(0);
  });

  it('1件の正値は100', () => {
    expect(CalendarEntity.getRecordFrequencyScore([5])).toBe(100);
  });

  it('全て0は0', () => {
    expect(CalendarEntity.getRecordFrequencyScore([0, 0, 0, 0])).toBe(0);
  });

  it('全て正値は100', () => {
    expect(CalendarEntity.getRecordFrequencyScore([1, 2, 3, 4])).toBe(100);
  });

  it('3件中1件記録ありは33', () => {
    expect(CalendarEntity.getRecordFrequencyScore([0, 1, 0])).toBe(33);
  });

  it('3件中2件記録ありは67', () => {
    expect(CalendarEntity.getRecordFrequencyScore([1, 0, 1])).toBe(67);
  });

  it('結果は0-100', () => {
    const result = CalendarEntity.getRecordFrequencyScore([0, 1, 0, 2, 0]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => (i % 3 === 0 ? 1 : 0));
    const result = CalendarEntity.getRecordFrequencyScore(data);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('記録件数に関わらず日数ベース', () => {
    const a = CalendarEntity.getRecordFrequencyScore([1, 0, 1]);
    const b = CalendarEntity.getRecordFrequencyScore([100, 0, 100]);
    expect(a).toBe(b);
  });

  it('交互パターン', () => {
    expect(CalendarEntity.getRecordFrequencyScore([1, 0, 1, 0])).toBe(50);
  });

  it('先頭のみ記録あり', () => {
    expect(CalendarEntity.getRecordFrequencyScore([1, 0, 0, 0, 0])).toBe(20);
  });

  it('末尾のみ記録あり', () => {
    expect(CalendarEntity.getRecordFrequencyScore([0, 0, 0, 0, 1])).toBe(20);
  });
});

describe('CalendarEntity.getRecordFrequencyScoreLabel - 境界値', () => {
  it('スコア80は高頻度(境界値)', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(80)).toBe('高頻度');
  });

  it('スコア79は中頻度', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(79)).toBe('中頻度');
  });

  it('スコア50は中頻度(境界値)', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(50)).toBe('中頻度');
  });

  it('スコア49は低頻度', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(49)).toBe('低頻度');
  });

  it('スコア0は低頻度', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(0)).toBe('低頻度');
  });

  it('スコア100は高頻度', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(100)).toBe('高頻度');
  });
});
