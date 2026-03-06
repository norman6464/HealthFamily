import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceRecoveryRate', () => {
  it('空配列は0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([50])).toBe(0);
  });

  it('下降のみ(回復なし)は0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100, 80, 60, 40])).toBe(0);
  });

  it('低下後の完全回復は100を返す', () => {
    // 100->50(低下50) -> 100(回復50) -> 回復率100%
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100, 50, 100])).toBe(100);
  });

  it('低下後の部分回復は中程度のスコア', () => {
    // 100->50(低下50) -> 75(回復25) -> 回復率50%
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([100, 50, 75])).toBe(50);
  });

  it('全て同じ値は0を返す(低下なし)', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([70, 70, 70])).toBe(0);
  });

  it('上昇のみは0を返す(低下なし)', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryRate([50, 60, 70, 80])).toBe(0);
  });

  it('0-100の範囲内に収まる', () => {
    const result = AdherenceTrendEntity.getAdherenceRecoveryRate([100, 0, 100]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('複数回の低下回復で最大の回復率を返す', () => {
    // 100->80(低下20)->90(回復10=50%) then 90->60(低下30)->90(回復30=100%)
    const result = AdherenceTrendEntity.getAdherenceRecoveryRate([100, 80, 90, 60, 90]);
    expect(result).toBe(100);
  });
});

describe('AdherenceTrendEntity.getAdherenceRecoveryLabel', () => {
  it('率70以上は良好', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(70)).toBe('良好');
  });

  it('率40以上はやや遅い', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(40)).toBe('やや遅い');
  });

  it('率40未満は低回復', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(20)).toBe('低回復');
  });

  it('率0は低回復', () => {
    expect(AdherenceTrendEntity.getAdherenceRecoveryLabel(0)).toBe('低回復');
  });
});
