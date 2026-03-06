import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionImprovementScore', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getConditionImprovementScore([])).toBe(0);
  });

  it('1件は0', () => {
    expect(HealthLogEntity.getConditionImprovementScore([3])).toBe(0);
  });

  it('改善（1→5）は100', () => {
    expect(HealthLogEntity.getConditionImprovementScore([1, 5])).toBe(100);
  });

  it('悪化（5→1）は0', () => {
    expect(HealthLogEntity.getConditionImprovementScore([5, 1])).toBe(0);
  });

  it('変化なしは50', () => {
    expect(HealthLogEntity.getConditionImprovementScore([3, 3])).toBe(50);
  });

  it('やや改善', () => {
    const result = HealthLogEntity.getConditionImprovementScore([2, 3, 4]);
    expect(result).toBeGreaterThan(50);
  });

  it('やや悪化', () => {
    const result = HealthLogEntity.getConditionImprovementScore([4, 3, 2]);
    expect(result).toBeLessThan(50);
  });

  it('結果は0-100の範囲', () => {
    const result = HealthLogEntity.getConditionImprovementScore([3, 2, 4, 1, 5]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('全て同じ値は50', () => {
    expect(HealthLogEntity.getConditionImprovementScore([3, 3, 3, 3])).toBe(50);
  });
});

describe('HealthLogEntity.getConditionImprovementScoreLabel', () => {
  it('スコア70以上は改善', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(80)).toBe('改善');
  });

  it('スコア30-70は横ばい', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(50)).toBe('横ばい');
  });

  it('スコア30未満は悪化', () => {
    expect(HealthLogEntity.getConditionImprovementScoreLabel(20)).toBe('悪化');
  });
});
