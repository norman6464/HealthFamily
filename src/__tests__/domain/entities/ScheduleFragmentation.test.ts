import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleFragmentation', () => {
  it('空配列は0を返す', () => {
    expect(ScheduleEntity.getScheduleFragmentation([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(ScheduleEntity.getScheduleFragmentation([480])).toBe(0);
  });

  it('同じ時刻は0を返す', () => {
    expect(ScheduleEntity.getScheduleFragmentation([480, 480, 480])).toBe(0);
  });

  it('適度に分散した時刻は中程度のスコア', () => {
    // 8:00, 12:00, 18:00 -> 間隔[240,360], stddev基準で算出
    const result = ScheduleEntity.getScheduleFragmentation([480, 720, 1080]);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(80);
  });

  it('極端に分散した時刻は高スコア', () => {
    // 0:00, 23:59 -> 最大分散
    const result = ScheduleEntity.getScheduleFragmentation([0, 1439]);
    expect(result).toBeGreaterThan(70);
  });

  it('近接した時刻は低スコア', () => {
    // 8:00, 8:30, 9:00
    const result = ScheduleEntity.getScheduleFragmentation([480, 510, 540]);
    expect(result).toBeLessThan(30);
  });

  it('0-100の範囲内に収まる', () => {
    const result = ScheduleEntity.getScheduleFragmentation([0, 720, 1439]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('全24時間に均等分散で高スコア', () => {
    // 0:00, 6:00, 12:00, 18:00
    const result = ScheduleEntity.getScheduleFragmentation([0, 360, 720, 1080]);
    expect(result).toBeGreaterThan(50);
  });
});

describe('ScheduleEntity.getScheduleFragmentationLabel', () => {
  it('スコア0は集中', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(0)).toBe('集中');
  });

  it('スコア40はやや分散', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(40)).toBe('やや分散');
  });

  it('スコア70は分散', () => {
    expect(ScheduleEntity.getScheduleFragmentationLabel(70)).toBe('分散');
  });
});
