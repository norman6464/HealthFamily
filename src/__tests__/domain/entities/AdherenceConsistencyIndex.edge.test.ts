import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity.getAdherenceConsistencyIndex エッジケース', () => {
  it('全て100は100', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex([100, 100, 100])).toBe(100);
  });

  it('0と100の交互', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([0, 100, 0, 100]);
    expect(result).toBeLessThan(50);
  });

  it('徐々に増加するデータ', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([20, 40, 60, 80, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('徐々に減少するデータ', () => {
    const increasing = AdherenceStatsEntity.getAdherenceConsistencyIndex([20, 40, 60, 80, 100]);
    const decreasing = AdherenceStatsEntity.getAdherenceConsistencyIndex([100, 80, 60, 40, 20]);
    expect(increasing).toBe(decreasing);
  });

  it('大量のデータ', () => {
    const values = Array.from({ length: 365 }, () => 80);
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex(values)).toBe(100);
  });

  it('2件で同値は100', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex([75, 75])).toBe(100);
  });

  it('負の値を含む場合', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([-10, 50, 80]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('100を超える値を含む場合', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([120, 90, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('小数値のデータ', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([75.5, 76.2, 74.8]);
    expect(result).toBeGreaterThan(90);
  });

  it('全て50は100', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndex([50, 50, 50, 50])).toBe(100);
  });

  it('結果は整数', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([30, 60, 45, 55]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('3件でばらつき大', () => {
    const result = AdherenceStatsEntity.getAdherenceConsistencyIndex([0, 50, 100]);
    expect(result).toBeLessThan(50);
  });
});

describe('AdherenceStatsEntity.getAdherenceConsistencyIndexLabel エッジケース', () => {
  it('境界値80は安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(80)).toBe('安定');
  });

  it('境界値50はやや不安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(50)).toBe('やや不安定');
  });

  it('境界値79はやや不安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(79)).toBe('やや不安定');
  });

  it('境界値49は不安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(49)).toBe('不安定');
  });

  it('0は不安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(0)).toBe('不安定');
  });

  it('100は安定', () => {
    expect(AdherenceStatsEntity.getAdherenceConsistencyIndexLabel(100)).toBe('安定');
  });
});
