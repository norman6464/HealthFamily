import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleFragmentation - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(ScheduleEntity.getScheduleFragmentation([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(ScheduleEntity.getScheduleFragmentation([720])).toBe(0);
  });

  it('2件で同じ時刻は0を返す', () => {
    expect(ScheduleEntity.getScheduleFragmentation([480, 480])).toBe(0);
  });

  it('2件で1分差は非常に低いスコア', () => {
    const result = ScheduleEntity.getScheduleFragmentation([480, 481]);
    expect(result).toBeLessThan(5);
  });

  it('0分と1439分(最大分散)は高スコア', () => {
    const result = ScheduleEntity.getScheduleFragmentation([0, 1439]);
    expect(result).toBeGreaterThan(90);
  });

  it('全て0分は0を返す', () => {
    expect(ScheduleEntity.getScheduleFragmentation([0, 0, 0, 0])).toBe(0);
  });

  it('100件の同一時刻は0', () => {
    const times = Array(100).fill(600);
    expect(ScheduleEntity.getScheduleFragmentation(times)).toBe(0);
  });

  it('均等に4分割された時刻は高スコア', () => {
    // 0:00, 6:00, 12:00, 18:00
    const result = ScheduleEntity.getScheduleFragmentation([0, 360, 720, 1080]);
    expect(result).toBeGreaterThan(40);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = ScheduleEntity.getScheduleFragmentation([0, 1439]);
    const result2 = ScheduleEntity.getScheduleFragmentation([100, 100]);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
  });

  it('3時間間隔は中程度のスコア', () => {
    // 6:00, 9:00, 12:00 -> stddev ~180min
    const result = ScheduleEntity.getScheduleFragmentation([360, 540, 720]);
    expect(result).toBeGreaterThan(15);
    expect(result).toBeLessThan(50);
  });

  it('大量のランダム風データでも範囲内', () => {
    const times = [0, 100, 200, 400, 600, 800, 1000, 1200, 1400];
    const result = ScheduleEntity.getScheduleFragmentation(times);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('ScheduleEntity.getScheduleFragmentationLabel - 境界値', () => {
  it('スコア60は分散(境界値)', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(60)).toBe('分散');
  });

  it('スコア59はやや分散', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(59)).toBe('やや分散');
  });

  it('スコア30はやや分散(境界値)', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(30)).toBe('やや分散');
  });

  it('スコア29は集中', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(29)).toBe('集中');
  });

  it('スコア0は集中', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(0)).toBe('集中');
  });

  it('スコア100は分散', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(100)).toBe('分散');
  });
});
