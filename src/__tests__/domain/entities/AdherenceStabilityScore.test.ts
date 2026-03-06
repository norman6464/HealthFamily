import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceStabilityScore', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([80])).toBe(100);
  });

  it('全て同じは100', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([50, 50, 50])).toBe(100);
  });

  it('大きな変動は低スコア', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([0, 100, 0, 100]);
    expect(result).toBeLessThan(50);
  });

  it('小さな変動は高スコア', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([48, 50, 52, 50]);
    expect(result).toBeGreaterThan(80);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([30, 50, 70, 90]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('安定なほどスコアが高い', () => {
    const stable = AdherenceTrendEntity.getAdherenceStabilityScore([50, 51, 50, 49]);
    const unstable = AdherenceTrendEntity.getAdherenceStabilityScore([10, 90, 20, 80]);
    expect(stable).toBeGreaterThan(unstable);
  });

  it('緩やかな変化', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([60, 65, 70, 75]);
    expect(result).toBeGreaterThan(50);
  });

  it('2件で同値は100', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([70, 70])).toBe(100);
  });
});

describe('AdherenceTrendEntity.getAdherenceStabilityScoreLabel', () => {
  it('スコア80以上は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(90)).toBe('安定');
  });

  it('スコア50-80はやや不安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(60)).toBe('やや不安定');
  });

  it('スコア50未満は不安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(30)).toBe('不安定');
  });
});
