import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity.getAdherenceEfficiencyScore - エッジケース', () => {
  it('両方0は0', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(0, 0)).toBe(0);
  });

  it('率100・ストリーク0', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(100, 0)).toBe(70);
  });

  it('率0・ストリーク30', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(0, 30)).toBe(30);
  });

  it('率100・ストリーク30は100', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(100, 30)).toBe(100);
  });

  it('率50・ストリーク15は50', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(50, 15)).toBe(50);
  });

  it('負の率は0扱い', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(-20, 10)).toBe(10);
  });

  it('超過率は100扱い', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(150, 0)).toBe(70);
  });

  it('超過ストリークは30扱い', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(100, 60)).toBe(100);
  });

  it('率が高いほどスコアが高い', () => {
    const low = AdherenceStatsEntity.getAdherenceEfficiencyScore(20, 10);
    const high = AdherenceStatsEntity.getAdherenceEfficiencyScore(80, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('ストリークが長いほどスコアが高い', () => {
    const low = AdherenceStatsEntity.getAdherenceEfficiencyScore(50, 1);
    const high = AdherenceStatsEntity.getAdherenceEfficiencyScore(50, 25);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceStatsEntity.getAdherenceEfficiencyScore(60, 12);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel - エッジケース', () => {
  it('100は高効率', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(100)).toBe('高効率');
  });

  it('80は高効率', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(80)).toBe('高効率');
  });

  it('79は普通', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(79)).toBe('普通');
  });

  it('50は普通', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(50)).toBe('普通');
  });

  it('49は低効率', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(49)).toBe('低効率');
  });

  it('0は低効率', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(0)).toBe('低効率');
  });
});
