import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getMonthlyVariance - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(CalendarEntity.getMonthlyVariance([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(CalendarEntity.getMonthlyVariance([15])).toBe(0);
  });

  it('2件で同じ値は0', () => {
    expect(CalendarEntity.getMonthlyVariance([20, 20])).toBe(0);
  });

  it('全て0は0を返す', () => {
    expect(CalendarEntity.getMonthlyVariance([0, 0, 0])).toBe(0);
  });

  it('100件の同一値は0', () => {
    expect(CalendarEntity.getMonthlyVariance(Array(100).fill(25))).toBe(0);
  });

  it('微小な差は低スコア', () => {
    const result = CalendarEntity.getMonthlyVariance([30, 31, 29, 30]);
    expect(result).toBeLessThan(5);
  });

  it('極端な差は高スコア', () => {
    const result = CalendarEntity.getMonthlyVariance([1, 100, 1, 100]);
    expect(result).toBeGreaterThan(80);
  });

  it('0-100の範囲内に収まる', () => {
    const result = CalendarEntity.getMonthlyVariance([0, 1000]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('緩やかな増加は中程度', () => {
    const result = CalendarEntity.getMonthlyVariance([10, 15, 20, 25, 30]);
    expect(result).toBeGreaterThan(10);
    expect(result).toBeLessThan(60);
  });

  it('ゼロと非ゼロの混在は高スコア', () => {
    const result = CalendarEntity.getMonthlyVariance([0, 30, 0, 30]);
    expect(result).toBeGreaterThan(60);
  });
});

describe('CalendarEntity.getMonthlyVarianceLabel - 境界値', () => {
  it('スコア60は不安定(境界値)', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(60)).toBe('不安定');
  });

  it('スコア59はやや不安定', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(59)).toBe('やや不安定');
  });

  it('スコア30はやや不安定(境界値)', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(30)).toBe('やや不安定');
  });

  it('スコア29は安定', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(29)).toBe('安定');
  });

  it('スコア0は安定', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(0)).toBe('安定');
  });

  it('スコア100は不安定', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(100)).toBe('不安定');
  });
});
