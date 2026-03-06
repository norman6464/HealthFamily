import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceStabilityScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([50])).toBe(100);
  });

  it('2件の同値は100', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([80, 80])).toBe(100);
  });

  it('全て0は100', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([0, 0, 0])).toBe(100);
  });

  it('全て100は100', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScore([100, 100, 100])).toBe(100);
  });

  it('最大変動[0,100]', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([0, 100]);
    expect(result).toBeLessThan(50);
  });

  it('緩やかな上昇', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([50, 55, 60, 65]);
    expect(result).toBeGreaterThan(70);
  });

  it('急激な変動', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([0, 100, 0, 100, 0]);
    expect(result).toBeLessThan(30);
  });

  it('小さな変動', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([49, 50, 51, 50]);
    expect(result).toBeGreaterThan(95);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceTrendEntity.getAdherenceStabilityScore([10, 90, 30, 70, 50]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('安定なほどスコアが高い', () => {
    const stable = AdherenceTrendEntity.getAdherenceStabilityScore([50, 50, 50]);
    const unstable = AdherenceTrendEntity.getAdherenceStabilityScore([10, 90, 50]);
    expect(stable).toBeGreaterThan(unstable);
  });

  it('大量データで安定', () => {
    const data = Array(50).fill(75);
    expect(AdherenceTrendEntity.getAdherenceStabilityScore(data)).toBe(100);
  });
});

describe('AdherenceTrendEntity.getAdherenceStabilityScoreLabel - エッジケース', () => {
  it('スコア100は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(100)).toBe('安定');
  });

  it('スコア80は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(80)).toBe('安定');
  });

  it('スコア79はやや不安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(79)).toBe('やや不安定');
  });

  it('スコア50はやや不安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(50)).toBe('やや不安定');
  });

  it('スコア49は不安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(49)).toBe('不安定');
  });

  it('スコア0は不安定', () => {
    expect(AdherenceTrendEntity.getAdherenceStabilityScoreLabel(0)).toBe('不安定');
  });
});
