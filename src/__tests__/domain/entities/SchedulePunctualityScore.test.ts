import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getSchedulePunctualityScore', () => {
  it('空配列は0', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([])).toBe(0);
  });

  it('全てぴったりは100', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([0, 0, 0])).toBe(100);
  });

  it('全て大幅遅延は0', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([60, 60, 60])).toBe(0);
  });

  it('小さな遅延は高スコア', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([5, 5, 5]);
    expect(result).toBeGreaterThan(80);
  });

  it('中程度の遅延は中スコア', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([30, 30, 30]);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(70);
  });

  it('結果は0-100', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([10, 20, 30, 40]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([7, 15, 22]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('負の値（早い場合）も絶対値で計算', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([-10, -10, -10]);
    expect(result).toBeGreaterThan(50);
  });

  it('1要素', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([15]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('遅延が大きいほどスコア低い', () => {
    const score1 = ScheduleEntity.getSchedulePunctualityScore([5]);
    const score2 = ScheduleEntity.getSchedulePunctualityScore([30]);
    expect(score1).toBeGreaterThan(score2);
  });
});

describe('ScheduleEntity.getSchedulePunctualityScoreLabel', () => {
  it('80以上は正確', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(90)).toBe('正確');
  });

  it('50以上はやや遅延', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(60)).toBe('やや遅延');
  });

  it('50未満は遅延多い', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(30)).toBe('遅延多い');
  });
});
