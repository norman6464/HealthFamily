import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceResilience', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([80])).toBe(0);
  });

  it('低下なしは100', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([50, 60, 70, 80])).toBe(100);
  });

  it('低下後に完全回復は高スコア', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([80, 40, 80]);
    expect(result).toBeGreaterThanOrEqual(80);
  });

  it('低下後に回復なしは低スコア', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([80, 40, 40]);
    expect(result).toBeLessThan(50);
  });

  it('結果は0-100', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([90, 30, 60, 20, 70]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('横ばいは100', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([50, 50, 50])).toBe(100);
  });

  it('回復が早いほどスコアが高い', () => {
    const fast = AdherenceTrendEntity.getAdherenceResilience([80, 40, 80]);
    const slow = AdherenceTrendEntity.getAdherenceResilience([80, 40, 50]);
    expect(fast).toBeGreaterThan(slow);
  });
});

describe('AdherenceTrendEntity.getAdherenceResilienceLabel', () => {
  it('スコア70以上は回復力高', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(80)).toBe('回復力高');
  });

  it('スコア40-70はやや回復', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(50)).toBe('やや回復');
  });

  it('スコア40未満は回復力低', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(20)).toBe('回復力低');
  });
});
