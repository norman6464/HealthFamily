import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordGapScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(CalendarEntity.getRecordGapScore([])).toBe(0);
  });

  it('1件で0は0', () => {
    expect(CalendarEntity.getRecordGapScore([0])).toBe(0);
  });

  it('1件で正値は100', () => {
    expect(CalendarEntity.getRecordGapScore([5])).toBe(100);
  });

  it('全て記録ありは100', () => {
    expect(CalendarEntity.getRecordGapScore([1, 1, 1, 1, 1, 1, 1])).toBe(100);
  });

  it('全て0は0', () => {
    expect(CalendarEntity.getRecordGapScore([0, 0, 0, 0, 0])).toBe(0);
  });

  it('最初だけ記録あり', () => {
    expect(CalendarEntity.getRecordGapScore([1, 0, 0, 0, 0])).toBe(20);
  });

  it('最後だけ記録あり', () => {
    expect(CalendarEntity.getRecordGapScore([0, 0, 0, 0, 1])).toBe(20);
  });

  it('交互パターン', () => {
    expect(CalendarEntity.getRecordGapScore([1, 0, 1, 0, 1, 0])).toBe(50);
  });

  it('大きな記録数も1日として扱う', () => {
    expect(CalendarEntity.getRecordGapScore([10, 0, 20])).toBe(67);
  });

  it('2件で片方0', () => {
    expect(CalendarEntity.getRecordGapScore([1, 0])).toBe(50);
  });

  it('2件で両方あり', () => {
    expect(CalendarEntity.getRecordGapScore([1, 1])).toBe(100);
  });

  it('大量データ', () => {
    const data = Array(100).fill(1);
    data[50] = 0;
    expect(CalendarEntity.getRecordGapScore(data)).toBe(99);
  });

  it('結果は0-100の範囲', () => {
    const result = CalendarEntity.getRecordGapScore([3, 0, 1, 0, 2, 0, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('CalendarEntity.getRecordGapScoreLabel - エッジケース', () => {
  it('スコア100は良好', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(100)).toBe('良好');
  });

  it('スコア80は良好', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(80)).toBe('良好');
  });

  it('スコア79はまずまず', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(79)).toBe('まずまず');
  });

  it('スコア50はまずまず', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(50)).toBe('まずまず');
  });

  it('スコア49は空白多い', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(49)).toBe('空白多い');
  });

  it('スコア0は空白多い', () => {
    expect(CalendarEntity.getRecordGapScoreLabel(0)).toBe('空白多い');
  });
});
