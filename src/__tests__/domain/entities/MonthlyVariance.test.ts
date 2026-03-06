import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getMonthlyVariance', () => {
  it('空配列は0を返す', () => {
    expect(CalendarEntity.getMonthlyVariance([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(CalendarEntity.getMonthlyVariance([10])).toBe(0);
  });

  it('全て同じ値は0を返す', () => {
    expect(CalendarEntity.getMonthlyVariance([20, 20, 20])).toBe(0);
  });

  it('安定した記録数は低スコア', () => {
    const result = CalendarEntity.getMonthlyVariance([28, 29, 30, 31]);
    expect(result).toBeLessThan(20);
  });

  it('大きくばらつく記録数は高スコア', () => {
    const result = CalendarEntity.getMonthlyVariance([5, 30, 5, 30]);
    expect(result).toBeGreaterThan(50);
  });

  it('0-100の範囲内に収まる', () => {
    const result = CalendarEntity.getMonthlyVariance([0, 100, 0, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('CalendarEntity.getMonthlyVarianceLabel', () => {
  it('スコア0は安定', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(0)).toBe('安定');
  });

  it('スコア40はやや不安定', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(40)).toBe('やや不安定');
  });

  it('スコア70は不安定', () => {
    expect(CalendarEntity.getMonthlyVarianceLabel(70)).toBe('不安定');
  });
});
