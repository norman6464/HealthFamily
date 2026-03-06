import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleLoadScore', () => {
  it('0件は0', () => {
    expect(ScheduleEntity.getScheduleLoadScore(0, 24)).toBe(0);
  });

  it('24件/24時間は100', () => {
    expect(ScheduleEntity.getScheduleLoadScore(24, 24)).toBe(100);
  });

  it('12件/24時間は50', () => {
    expect(ScheduleEntity.getScheduleLoadScore(12, 24)).toBe(50);
  });

  it('時間0は0', () => {
    expect(ScheduleEntity.getScheduleLoadScore(5, 0)).toBe(0);
  });

  it('件数が多いほど負荷が高い', () => {
    const low = ScheduleEntity.getScheduleLoadScore(2, 24);
    const high = ScheduleEntity.getScheduleLoadScore(20, 24);
    expect(high).toBeGreaterThan(low);
  });

  it('上限100', () => {
    expect(ScheduleEntity.getScheduleLoadScore(50, 24)).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = ScheduleEntity.getScheduleLoadScore(5, 12);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1件', () => {
    const result = ScheduleEntity.getScheduleLoadScore(1, 24);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });
});

describe('ScheduleEntity.getScheduleLoadScoreLabel', () => {
  it('スコア70以上は過密', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(80)).toBe('過密');
  });

  it('スコア30-70は適度', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(50)).toBe('適度');
  });

  it('スコア30未満は余裕', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(20)).toBe('余裕');
  });
});
