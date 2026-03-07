import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity.getAdherenceEfficiencyScore', () => {
  it('両方0は0', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(0, 0)).toBe(0);
  });

  it('率100・ストリーク高は100', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(100, 30)).toBe(100);
  });

  it('率0は低い', () => {
    const result = AdherenceStatsEntity.getAdherenceEfficiencyScore(0, 10);
    expect(result).toBeLessThan(30);
  });

  it('率が高いほどスコアが高い', () => {
    const low = AdherenceStatsEntity.getAdherenceEfficiencyScore(30, 5);
    const high = AdherenceStatsEntity.getAdherenceEfficiencyScore(90, 5);
    expect(high).toBeGreaterThan(low);
  });

  it('ストリークが長いほどスコアが高い', () => {
    const low = AdherenceStatsEntity.getAdherenceEfficiencyScore(80, 1);
    const high = AdherenceStatsEntity.getAdherenceEfficiencyScore(80, 20);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceStatsEntity.getAdherenceEfficiencyScore(70, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('中程度の値', () => {
    const result = AdherenceStatsEntity.getAdherenceEfficiencyScore(50, 15);
    expect(result).toBeGreaterThan(20);
    expect(result).toBeLessThan(80);
  });

  it('超過しても100', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScore(150, 60)).toBeLessThanOrEqual(100);
  });
});

describe('AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel', () => {
  it('スコア高は高効率', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(85)).toBe('高効率');
  });

  it('スコア中は普通', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(55)).toBe('普通');
  });

  it('スコア低は低効率', () => {
    expect(AdherenceStatsEntity.getAdherenceEfficiencyScoreLabel(25)).toBe('低効率');
  });
});
