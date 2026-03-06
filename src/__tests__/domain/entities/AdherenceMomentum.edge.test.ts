import { describe, it, expect } from 'vitest';
import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity.getAdherenceMomentum - エッジケース', () => {
  it('空配列は0', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([])).toBe(0);
  });

  it('1件は0', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([50])).toBe(0);
  });

  it('2件は0', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([50, 60])).toBe(0);
  });

  it('3件の上昇は正', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([50, 60, 70]);
    expect(result).toBeGreaterThan(0);
  });

  it('3件の下降は負', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([70, 60, 50]);
    expect(result).toBeLessThan(0);
  });

  it('3件の横ばいは0', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([50, 50, 50])).toBe(0);
  });

  it('全て0は0', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([0, 0, 0, 0])).toBe(0);
  });

  it('全て100は0', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentum([100, 100, 100])).toBe(0);
  });

  it('V字回復は正のモメンタム', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([80, 40, 60, 80]);
    expect(result).toBeGreaterThan(0);
  });

  it('逆V字は負のモメンタム', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([40, 80, 60, 40]);
    expect(result).toBeLessThan(0);
  });

  it('急上昇は大きな正値', () => {
    const gradual = AdherenceTrendEntity.getAdherenceMomentum([50, 55, 60]);
    const steep = AdherenceTrendEntity.getAdherenceMomentum([50, 70, 90]);
    expect(steep).toBeGreaterThan(gradual);
  });

  it('急下降は大きな負値', () => {
    const gradual = AdherenceTrendEntity.getAdherenceMomentum([60, 55, 50]);
    const steep = AdherenceTrendEntity.getAdherenceMomentum([90, 70, 50]);
    expect(steep).toBeLessThan(gradual);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 50 }, (_, i) => i * 2);
    const result = AdherenceTrendEntity.getAdherenceMomentum(data);
    expect(result).toBeGreaterThan(0);
  });

  it('交互パターン', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([50, 80, 50, 80]);
    expect(typeof result).toBe('number');
  });

  it('微小な変化', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([50, 50.1, 50.2]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('0から100への急上昇', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([0, 50, 100]);
    expect(result).toBeGreaterThan(0);
  });

  it('100から0への急下降', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([100, 50, 0]);
    expect(result).toBeLessThan(0);
  });

  it('同一変化量の長いシーケンス', () => {
    const result = AdherenceTrendEntity.getAdherenceMomentum([10, 20, 30, 40, 50]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('AdherenceTrendEntity.getAdherenceMomentumLabel - 境界値', () => {
  it('モメンタム5は加速改善(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(5)).toBe('加速改善');
  });

  it('モメンタム4.99は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(4.99)).toBe('安定');
  });

  it('モメンタム-5は加速悪化(境界値)', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(-5)).toBe('加速悪化');
  });

  it('モメンタム-4.99は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(-4.99)).toBe('安定');
  });

  it('モメンタム0は安定', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(0)).toBe('安定');
  });

  it('モメンタム100は加速改善', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(100)).toBe('加速改善');
  });

  it('モメンタム-100は加速悪化', () => {
    expect(AdherenceTrendEntity.getAdherenceMomentumLabel(-100)).toBe('加速悪化');
  });
});
