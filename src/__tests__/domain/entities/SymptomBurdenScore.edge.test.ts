import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getSymptomBurdenScore - エッジケース', () => {
  it('症状0は常に0', () => {
    expect(HealthLogEntity.getSymptomBurdenScore(0, 3)).toBe(0);
  });

  it('症状0・体調0も0', () => {
    expect(HealthLogEntity.getSymptomBurdenScore(0, 0)).toBe(0);
  });

  it('症状最大・体調最悪', () => {
    const result = HealthLogEntity.getSymptomBurdenScore(5, 1);
    expect(result).toBeGreaterThan(70);
  });

  it('症状最大・体調最良', () => {
    const result = HealthLogEntity.getSymptomBurdenScore(5, 5);
    expect(result).toBe(50);
  });

  it('症状1・体調最悪', () => {
    const result = HealthLogEntity.getSymptomBurdenScore(1, 1);
    expect(result).toBeGreaterThan(30);
  });

  it('症状1・体調最良', () => {
    const result = HealthLogEntity.getSymptomBurdenScore(1, 5);
    expect(result).toBe(10);
  });

  it('症状が多いほどスコアが高い', () => {
    const low = HealthLogEntity.getSymptomBurdenScore(1, 3);
    const high = HealthLogEntity.getSymptomBurdenScore(5, 3);
    expect(high).toBeGreaterThan(low);
  });

  it('体調が悪いほどスコアが高い', () => {
    const low = HealthLogEntity.getSymptomBurdenScore(3, 5);
    const high = HealthLogEntity.getSymptomBurdenScore(3, 1);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = HealthLogEntity.getSymptomBurdenScore(3, 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('超過しても100以下', () => {
    expect(HealthLogEntity.getSymptomBurdenScore(100, 0)).toBeLessThanOrEqual(100);
  });
});

describe('HealthLogEntity.getSymptomBurdenScoreLabel - エッジケース', () => {
  it('100は重い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(100)).toBe('重い');
  });

  it('70は重い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(70)).toBe('重い');
  });

  it('69はやや重い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(69)).toBe('やや重い');
  });

  it('40はやや重い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(40)).toBe('やや重い');
  });

  it('39は軽い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(39)).toBe('軽い');
  });

  it('0は軽い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(0)).toBe('軽い');
  });
});
