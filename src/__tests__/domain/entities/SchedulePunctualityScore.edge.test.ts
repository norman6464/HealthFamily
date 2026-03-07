import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getSchedulePunctualityScore エッジケース', () => {
  it('全て0分遅延は100', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([0, 0, 0, 0])).toBe(100);
  });

  it('1分遅延は高スコア', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([1]);
    expect(result).toBeGreaterThan(95);
  });

  it('60分遅延は0', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([60])).toBe(0);
  });

  it('120分遅延でも0', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([120])).toBe(0);
  });

  it('30分遅延は50', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([30])).toBe(50);
  });

  it('負の遅延（早い）も絶対値で評価', () => {
    const pos = ScheduleEntity.getSchedulePunctualityScore([15]);
    const neg = ScheduleEntity.getSchedulePunctualityScore([-15]);
    expect(pos).toBe(neg);
  });

  it('混在する正負の遅延', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([-10, 10, -5, 5]);
    expect(result).toBeGreaterThan(70);
  });

  it('結果は整数', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([7, 13, 22]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('多数の要素', () => {
    const delays = Array.from({ length: 100 }, () => 10);
    const result = ScheduleEntity.getSchedulePunctualityScore(delays);
    expect(result).toBeGreaterThan(70);
  });

  it('小数の遅延', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([5.5, 10.5]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('0と大きな遅延の混在', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([0, 60]);
    expect(result).toBe(50);
  });

  it('15分遅延は75', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([15])).toBe(75);
  });

  it('45分遅延は25', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([45])).toBe(25);
  });

  it('全て非常に小さな遅延', () => {
    const result = ScheduleEntity.getSchedulePunctualityScore([0.1, 0.2, 0.3]);
    expect(result).toBeGreaterThan(99);
  });

  it('遅延が増えるとスコアは下がる', () => {
    const score1 = ScheduleEntity.getSchedulePunctualityScore([10]);
    const score2 = ScheduleEntity.getSchedulePunctualityScore([40]);
    expect(score1).toBeGreaterThan(score2);
  });

  it('非常に大きな遅延は0', () => {
    expect(ScheduleEntity.getSchedulePunctualityScore([1000])).toBe(0);
  });
});

describe('ScheduleEntity.getSchedulePunctualityScoreLabel エッジケース', () => {
  it('境界値80は正確', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(80)).toBe('正確');
  });

  it('境界値50はやや遅延', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(50)).toBe('やや遅延');
  });

  it('境界値79はやや遅延', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(79)).toBe('やや遅延');
  });

  it('境界値49は遅延多い', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(49)).toBe('遅延多い');
  });

  it('0は遅延多い', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(0)).toBe('遅延多い');
  });

  it('100は正確', () => {
    expect(ScheduleEntity.getSchedulePunctualityScoreLabel(100)).toBe('正確');
  });
});
