import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getSymptomBurdenScore', () => {
  it('両方0は0', () => {
    expect(HealthLogEntity.getSymptomBurdenScore(0, 0)).toBe(0);
  });

  it('症状数多い・体調悪いはスコアが高い', () => {
    const result = HealthLogEntity.getSymptomBurdenScore(5, 1);
    expect(result).toBeGreaterThan(70);
  });

  it('症状なし・体調良いは0', () => {
    expect(HealthLogEntity.getSymptomBurdenScore(0, 5)).toBe(0);
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

  it('最大100', () => {
    expect(HealthLogEntity.getSymptomBurdenScore(10, 1)).toBeLessThanOrEqual(100);
  });
});

describe('HealthLogEntity.getSymptomBurdenScoreLabel', () => {
  it('スコア高は重い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(80)).toBe('重い');
  });

  it('スコア中はやや重い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(50)).toBe('やや重い');
  });

  it('スコア低は軽い', () => {
    expect(HealthLogEntity.getSymptomBurdenScoreLabel(20)).toBe('軽い');
  });
});
