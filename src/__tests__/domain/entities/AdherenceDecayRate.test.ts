import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceDecayRate', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([80])).toBe(0);
  });

  it('同値は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([50, 50, 50])).toBe(0);
  });

  it('完全減少は100', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([100, 0])).toBe(100);
  });

  it('改善は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([50, 80])).toBe(0);
  });

  it('部分的な減少', () => {
    const result = AdherenceTrendEntity.getAdherenceDecayRate([100, 80, 60]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceTrendEntity.getAdherenceDecayRate([90, 70, 60]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('減少率が大きいほどスコアが高い', () => {
    const small = AdherenceTrendEntity.getAdherenceDecayRate([100, 95]);
    const large = AdherenceTrendEntity.getAdherenceDecayRate([100, 30]);
    expect(large).toBeGreaterThan(small);
  });
});

describe('AdherenceTrendEntity.getAdherenceDecayRateLabel', () => {
  it('率高は急減', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(75)).toBe('急減');
  });

  it('率中はやや減少', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(40)).toBe('やや減少');
  });

  it('率低は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(10)).toBe('安定');
  });
});
