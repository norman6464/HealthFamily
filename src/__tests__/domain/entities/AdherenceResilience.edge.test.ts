import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceResilience - エッジケース', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([80])).toBe(0);
  });

  it('2件上昇は100', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([50, 80])).toBe(100);
  });

  it('2件横ばいは100', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([50, 50])).toBe(100);
  });

  it('2件低下で回復なし', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([80, 40]);
    expect(result).toBeLessThan(50);
  });

  it('完全回復は高スコア', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([100, 50, 100]);
    expect(result).toBeGreaterThanOrEqual(80);
  });

  it('部分回復は中スコア', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([100, 50, 75]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(100);
  });

  it('回復なしは0', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([80, 40, 40]);
    expect(result).toBe(0);
  });

  it('連続上昇は100', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([10, 30, 50, 70, 90])).toBe(100);
  });

  it('連続低下は低スコア', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([90, 70, 50, 30]);
    expect(result).toBeLessThan(50);
  });

  it('V字回復', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([90, 30, 90]);
    expect(result).toBeGreaterThanOrEqual(80);
  });

  it('W字パターン', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([80, 40, 70, 30, 60]);
    expect(result).toBeGreaterThan(0);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 50 }, (_, i) => 50 + Math.sin(i) * 30);
    const result = AdherenceTrendEntity.getAdherenceResilience(data);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('全て0は100(低下なし)', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([0, 0, 0])).toBe(100);
  });

  it('全て100は100(低下なし)', () => {
    expect(AdherenceTrendEntity.getAdherenceResilience([100, 100, 100])).toBe(100);
  });

  it('微小な低下と回復', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([80, 79, 80]);
    expect(result).toBeGreaterThanOrEqual(80);
  });

  it('結果は0-100', () => {
    const result = AdherenceTrendEntity.getAdherenceResilience([90, 10, 50, 20, 80]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('AdherenceTrendEntity.getAdherenceResilienceLabel - 境界値', () => {
  it('スコア70は回復力高(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(70)).toBe('回復力高');
  });

  it('スコア69はやや回復', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(69)).toBe('やや回復');
  });

  it('スコア40はやや回復(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(40)).toBe('やや回復');
  });

  it('スコア39は回復力低', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(39)).toBe('回復力低');
  });

  it('スコア0は回復力低', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(0)).toBe('回復力低');
  });

  it('スコア100は回復力高', () => {
    expect(AdherenceTrendEntity.getAdherenceResilienceLabel(100)).toBe('回復力高');
  });
});
