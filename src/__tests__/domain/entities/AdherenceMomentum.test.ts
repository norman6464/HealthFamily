import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceMomentum', () => {
  it('空配列は0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([80])).toBe(0);
  });

  it('2件は0を返す', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([80, 90])).toBe(0);
  });

  it('上昇トレンドは正のモメンタム', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([50, 60, 70, 80]);
    expect(result).toBeGreaterThan(0);
  });

  it('下降トレンドは負のモメンタム', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([80, 70, 60, 50]);
    expect(result).toBeLessThan(0);
  });

  it('横ばいは0に近い', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([50, 50, 50, 50]);
    expect(result).toBe(0);
  });

  it('加速上昇は減速上昇より大きい', () => {
    // 加速: 差が増加 10,20,30
    const accel = AdherenceTrendEntity.getAdherenceMomentum([10, 20, 40, 70]);
    // 減速: 差が減少 30,20,10
    const decel = AdherenceTrendEntity.getAdherenceMomentum([10, 40, 60, 70]);
    expect(accel).toBeGreaterThan(decel);
  });
});

describe('AdherenceTrendEntity.getAdherenceMomentumLabel', () => {
  it('モメンタム5以上は加速改善', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(10)).toBe('加速改善');
  });

  it('モメンタム-5超5未満は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(0)).toBe('安定');
  });

  it('モメンタム-5以下は加速悪化', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(-10)).toBe('加速悪化');
  });
});
