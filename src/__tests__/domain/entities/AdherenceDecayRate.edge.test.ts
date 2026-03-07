import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceDecayRate - エッジケース', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([100])).toBe(0);
  });

  it('同値は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([80, 80, 80])).toBe(0);
  });

  it('完全減少は100', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([100, 0])).toBe(100);
  });

  it('半減は50', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([100, 50])).toBe(50);
  });

  it('改善は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([50, 80])).toBe(0);
  });

  it('初期0は0', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRate([0, 50])).toBe(0);
  });

  it('中間値は無視（最初と最後のみ）', () => {
    // 100 -> 50: 50% decay
    expect(AdherenceTrendEntity.getAdherenceDecayRate([100, 0, 50])).toBe(50);
  });

  it('大量データで減少', () => {
    const data = Array.from({ length: 10 }, (_, i) => 100 - i * 10);
    // 100 -> 10: 90% decay
    expect(AdherenceTrendEntity.getAdherenceDecayRate(data)).toBe(90);
  });

  it('わずかな減少', () => {
    const result = AdherenceTrendEntity.getAdherenceDecayRate([100, 95]);
    expect(result).toBe(5);
  });

  it('結果は0-100の範囲', () => {
    const result = AdherenceTrendEntity.getAdherenceDecayRate([90, 60]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('減少が大きいほど率が高い', () => {
    const small = AdherenceTrendEntity.getAdherenceDecayRate([100, 90]);
    const large = AdherenceTrendEntity.getAdherenceDecayRate([100, 20]);
    expect(large).toBeGreaterThan(small);
  });
});

describe('AdherenceTrendEntity.getAdherenceDecayRateLabel - エッジケース', () => {
  it('100は急減', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(100)).toBe('急減');
  });

  it('60は急減', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(60)).toBe('急減');
  });

  it('59はやや減少', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(59)).toBe('やや減少');
  });

  it('20はやや減少', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(20)).toBe('やや減少');
  });

  it('19は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(19)).toBe('安定');
  });

  it('0は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceDecayRateLabel(0)).toBe('安定');
  });
});
