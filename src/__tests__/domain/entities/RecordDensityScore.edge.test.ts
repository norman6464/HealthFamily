import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity.getRecordDensityScore - エッジケース', () => {
  it('記録日0は0', () => {
    expect(CalendarEntity.getRecordDensityScore(0, 30)).toBe(0);
  });

  it('期間0は0', () => {
    expect(CalendarEntity.getRecordDensityScore(10, 0)).toBe(0);
  });

  it('両方0は0', () => {
    expect(CalendarEntity.getRecordDensityScore(0, 0)).toBe(0);
  });

  it('負の記録日は0', () => {
    expect(CalendarEntity.getRecordDensityScore(-5, 30)).toBe(0);
  });

  it('負の期間は0', () => {
    expect(CalendarEntity.getRecordDensityScore(10, -5)).toBe(0);
  });

  it('全日記録は100', () => {
    expect(CalendarEntity.getRecordDensityScore(30, 30)).toBe(100);
  });

  it('記録日が期間を超えても100', () => {
    expect(CalendarEntity.getRecordDensityScore(40, 30)).toBe(100);
  });

  it('1日/1日は100', () => {
    expect(CalendarEntity.getRecordDensityScore(1, 1)).toBe(100);
  });

  it('1日/30日は約3', () => {
    expect(CalendarEntity.getRecordDensityScore(1, 30)).toBe(3);
  });

  it('半分記録は50', () => {
    expect(CalendarEntity.getRecordDensityScore(15, 30)).toBe(50);
  });

  it('結果は0-100', () => {
    const result = CalendarEntity.getRecordDensityScore(10, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1日/365日', () => {
    const result = CalendarEntity.getRecordDensityScore(1, 365);
    expect(result).toBe(0);
  });

  it('364日/365日', () => {
    const result = CalendarEntity.getRecordDensityScore(364, 365);
    expect(result).toBe(100);
  });

  it('大きな値でも正常', () => {
    const result = CalendarEntity.getRecordDensityScore(1000, 1000);
    expect(result).toBe(100);
  });

  it('小さな割合は丸め処理される', () => {
    const result = CalendarEntity.getRecordDensityScore(1, 3);
    expect(result).toBe(33);
  });

  it('2/3は67', () => {
    expect(CalendarEntity.getRecordDensityScore(2, 3)).toBe(67);
  });
});

describe('CalendarEntity.getRecordDensityScoreLabel - 境界値', () => {
  it('スコア80は高密度(境界値)', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(80)).toBe('高密度');
  });

  it('スコア79は中密度', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(79)).toBe('中密度');
  });

  it('スコア50は中密度(境界値)', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(50)).toBe('中密度');
  });

  it('スコア49は低密度', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(49)).toBe('低密度');
  });

  it('スコア0は低密度', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(0)).toBe('低密度');
  });

  it('スコア100は高密度', () => {
    expect(CalendarEntity.getRecordDensityScoreLabel(100)).toBe('高密度');
  });
});
