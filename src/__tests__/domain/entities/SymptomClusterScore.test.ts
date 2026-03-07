import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getSymptomClusterScore', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getSymptomClusterScore([])).toBe(0);
  });

  it('全て0は0', () => {
    expect(HealthLogEntity.getSymptomClusterScore([0, 0, 0])).toBe(0);
  });

  it('全て1は低スコア', () => {
    const result = HealthLogEntity.getSymptomClusterScore([1, 1, 1]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(30);
  });

  it('多数の症状同時出現は高スコア', () => {
    const result = HealthLogEntity.getSymptomClusterScore([5, 4, 5]);
    expect(result).toBeGreaterThan(50);
  });

  it('結果は0-100', () => {
    const result = HealthLogEntity.getSymptomClusterScore([2, 3, 1, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = HealthLogEntity.getSymptomClusterScore([1, 3, 2]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('1要素', () => {
    const result = HealthLogEntity.getSymptomClusterScore([3]);
    expect(result).toBeGreaterThan(0);
  });

  it('負の値は0として扱う', () => {
    const result = HealthLogEntity.getSymptomClusterScore([-1, 2, 3]);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('症状数が増えるとスコアも上がる', () => {
    const score1 = HealthLogEntity.getSymptomClusterScore([1, 1]);
    const score2 = HealthLogEntity.getSymptomClusterScore([5, 5]);
    expect(score2).toBeGreaterThan(score1);
  });

  it('多数のログ', () => {
    const counts = Array.from({ length: 30 }, () => 2);
    const result = HealthLogEntity.getSymptomClusterScore(counts);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('最大5症状で全てのログが5は100', () => {
    expect(HealthLogEntity.getSymptomClusterScore([5, 5, 5, 5])).toBe(100);
  });
});

describe('HealthLogEntity.getSymptomClusterScoreLabel', () => {
  it('70以上は集中的', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(80)).toBe('集中的');
  });

  it('40以上はやや集中', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(50)).toBe('やや集中');
  });

  it('40未満は分散的', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(20)).toBe('分散的');
  });
});
