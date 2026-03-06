import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getConditionPeakScore', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getConditionPeakScore([])).toBe(0);
  });

  it('1件はその値のスコア', () => {
    const result = HealthLogEntity.getConditionPeakScore([5]);
    expect(result).toBe(100);
  });

  it('最大値5は100', () => {
    expect(HealthLogEntity.getConditionPeakScore([1, 3, 5, 2])).toBe(100);
  });

  it('最大値1は20', () => {
    expect(HealthLogEntity.getConditionPeakScore([1, 1, 1])).toBe(20);
  });

  it('結果は0-100', () => {
    const result = HealthLogEntity.getConditionPeakScore([2, 3, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('ピークが高いほどスコアが高い', () => {
    const low = HealthLogEntity.getConditionPeakScore([1, 2, 1]);
    const high = HealthLogEntity.getConditionPeakScore([1, 5, 1]);
    expect(high).toBeGreaterThan(low);
  });
});

describe('HealthLogEntity.getConditionPeakScoreLabel', () => {
  it('スコア80以上は絶好調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(90)).toBe('絶好調');
  });

  it('スコア50-80は好調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(60)).toBe('好調');
  });

  it('スコア50未満は不調', () => {
    expect(HealthLogEntity.getConditionPeakScoreLabel(30)).toBe('不調');
  });
});
