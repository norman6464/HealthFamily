import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getHealthTrendScore', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getHealthTrendScore([])).toBe(0);
  });

  it('全て最高は100', () => {
    expect(HealthLogEntity.getHealthTrendScore([5, 5, 5])).toBe(100);
  });

  it('全て最低は20', () => {
    expect(HealthLogEntity.getHealthTrendScore([1, 1, 1])).toBe(20);
  });

  it('体調が良いほどスコアが高い', () => {
    const low = HealthLogEntity.getHealthTrendScore([1, 2, 1]);
    const high = HealthLogEntity.getHealthTrendScore([4, 5, 4]);
    expect(high).toBeGreaterThan(low);
  });

  it('1件は単純変換', () => {
    expect(HealthLogEntity.getHealthTrendScore([3])).toBe(60);
  });

  it('結果は0-100の範囲', () => {
    const result = HealthLogEntity.getHealthTrendScore([2, 3, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('中程度の値', () => {
    const result = HealthLogEntity.getHealthTrendScore([3, 3, 3]);
    expect(result).toBe(60);
  });
});

describe('HealthLogEntity.getHealthTrendScoreLabel', () => {
  it('スコア高は良好', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(85)).toBe('良好');
  });

  it('スコア中は普通', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(55)).toBe('普通');
  });

  it('スコア低は注意', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(25)).toBe('注意');
  });
});
