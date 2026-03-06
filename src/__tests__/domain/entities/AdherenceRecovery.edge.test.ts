import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceRecoveryRate - エッジケース', () => {
  it('空配列は0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100])).toBe(0);
  });

  it('2件で低下のみは0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100, 50])).toBe(0);
  });

  it('2件で上昇のみは0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([50, 100])).toBe(0);
  });

  it('3件で完全回復は100', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100, 0, 100])).toBe(100);
  });

  it('3件で半分回復は50', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100, 0, 50])).toBe(50);
  });

  it('全て同じ値は0', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([70, 70, 70, 70])).toBe(0);
  });

  it('連続低下のみは0', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100, 80, 60, 40, 20])).toBe(0);
  });

  it('連続上昇のみは0', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([20, 40, 60, 80, 100])).toBe(0);
  });

  it('V字回復パターン', () => {
    const result = AdherenceTrendEntity.getAdherenceRecoveryRate([90, 80, 70, 60, 70, 80, 90]);
    expect(result).toBe(100);
  });

  it('部分回復パターン', () => {
    // 100->40(低下60), 40->70(回復30) = 50%
    const result = AdherenceTrendEntity.getAdherenceRecoveryRate([100, 40, 70]);
    expect(result).toBe(50);
  });

  it('0-100の範囲内', () => {
    const result = AdherenceTrendEntity.getAdherenceRecoveryRate([100, 0, 200]);
    expect(result).toBeLessThanOrEqual(100);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('微小な低下と完全回復', () => {
    const result = AdherenceTrendEntity.getAdherenceRecoveryRate([100, 99, 100]);
    expect(result).toBe(100);
  });

  it('複数回低下の最大回復率', () => {
    // 第1回: 100->90(低下10)->92(回復2=20%)
    // 第2回: 92->50(低下42)->80(回復30=71%)
    const result = AdherenceTrendEntity.getAdherenceRecoveryRate([100, 90, 92, 50, 80]);
    expect(result).toBeGreaterThan(60);
  });
});

describe('AdherenceTrendEntity.getAdherenceRecoveryLabel - 境界値', () => {
  it('率70は良好(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(70)).toBe('良好');
  });

  it('率69はやや遅い', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(69)).toBe('やや遅い');
  });

  it('率40はやや遅い(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(40)).toBe('やや遅い');
  });

  it('率39は低回復', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(39)).toBe('低回復');
  });

  it('率0は低回復', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(0)).toBe('低回復');
  });

  it('率100は良好', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(100)).toBe('良好');
  });
});
