import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity.getScheduleLoadScore - エッジケース', () => {
  it('0件・0時間は0', () => {
    expect(ScheduleEntity.getScheduleLoadScore(0, 0)).toBe(0);
  });

  it('件数あり・0時間は0', () => {
    expect(ScheduleEntity.getScheduleLoadScore(10, 0)).toBe(0);
  });

  it('0件・時間ありは0', () => {
    expect(ScheduleEntity.getScheduleLoadScore(0, 24)).toBe(0);
  });

  it('1件/1時間は100', () => {
    expect(ScheduleEntity.getScheduleLoadScore(1, 1)).toBe(100);
  });

  it('1件/2時間は50', () => {
    expect(ScheduleEntity.getScheduleLoadScore(1, 2)).toBe(50);
  });

  it('2件/1時間は100(上限)', () => {
    expect(ScheduleEntity.getScheduleLoadScore(2, 1)).toBe(100);
  });

  it('大量件数は100', () => {
    expect(ScheduleEntity.getScheduleLoadScore(100, 10)).toBe(100);
  });

  it('1件/24時間', () => {
    const result = ScheduleEntity.getScheduleLoadScore(1, 24);
    expect(result).toBe(4);
  });

  it('6件/24時間は25', () => {
    expect(ScheduleEntity.getScheduleLoadScore(6, 24)).toBe(25);
  });

  it('12件/24時間は50', () => {
    expect(ScheduleEntity.getScheduleLoadScore(12, 24)).toBe(50);
  });

  it('結果は0-100の範囲', () => {
    const result = ScheduleEntity.getScheduleLoadScore(5, 12);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('件数が多いほど負荷が高い', () => {
    const low = ScheduleEntity.getScheduleLoadScore(3, 24);
    const high = ScheduleEntity.getScheduleLoadScore(18, 24);
    expect(high).toBeGreaterThan(low);
  });

  it('時間が多いほど負荷が低い', () => {
    const low = ScheduleEntity.getScheduleLoadScore(6, 24);
    const high = ScheduleEntity.getScheduleLoadScore(6, 6);
    expect(high).toBeGreaterThan(low);
  });
});

describe('ScheduleEntity.getScheduleLoadScoreLabel - エッジケース', () => {
  it('スコア100は過密', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(100)).toBe('過密');
  });

  it('スコア70は過密', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(70)).toBe('過密');
  });

  it('スコア69は適度', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(69)).toBe('適度');
  });

  it('スコア30は適度', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(30)).toBe('適度');
  });

  it('スコア29は余裕', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(29)).toBe('余裕');
  });

  it('スコア0は余裕', () => {
    expect(ScheduleEntity.getScheduleLoadScoreLabel(0)).toBe('余裕');
  });
});
