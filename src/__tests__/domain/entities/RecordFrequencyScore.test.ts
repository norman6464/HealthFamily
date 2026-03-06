import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordFrequencyScore', () => {
  it('空配列は0', () => {
    expect(CalendarEntity.getRecordFrequencyScore([])).toBe(0);
  });

  it('全て0件は0', () => {
    expect(CalendarEntity.getRecordFrequencyScore([0, 0, 0])).toBe(0);
  });

  it('全て記録ありは100', () => {
    expect(CalendarEntity.getRecordFrequencyScore([1, 2, 3, 1])).toBe(100);
  });

  it('半分記録ありは50', () => {
    expect(CalendarEntity.getRecordFrequencyScore([1, 0, 1, 0])).toBe(50);
  });

  it('1日のみ記録', () => {
    const result = CalendarEntity.getRecordFrequencyScore([0, 0, 1, 0, 0]);
    expect(result).toBe(20);
  });

  it('結果は0-100', () => {
    const result = CalendarEntity.getRecordFrequencyScore([1, 0, 2, 0, 3]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('記録件数に関わらず記録日数でカウント', () => {
    const onePerDay = CalendarEntity.getRecordFrequencyScore([1, 1, 1]);
    const manyPerDay = CalendarEntity.getRecordFrequencyScore([5, 5, 5]);
    expect(onePerDay).toBe(manyPerDay);
  });
});

describe('CalendarEntity.getRecordFrequencyScoreLabel', () => {
  it('スコア80以上は高頻度', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(90)).toBe('高頻度');
  });

  it('スコア50-80は中頻度', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(60)).toBe('中頻度');
  });

  it('スコア50未満は低頻度', () => {
    expect(CalendarEntity.getRecordFrequencyScoreLabel(30)).toBe('低頻度');
  });
});
