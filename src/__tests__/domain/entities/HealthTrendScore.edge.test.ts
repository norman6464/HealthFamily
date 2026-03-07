import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getHealthTrendScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(HealthLogEntity.getHealthTrendScore([])).toBe(0);
  });

  it('1件・レベル1は20', () => {
    expect(HealthLogEntity.getHealthTrendScore([1])).toBe(20);
  });

  it('1件・レベル5は100', () => {
    expect(HealthLogEntity.getHealthTrendScore([5])).toBe(100);
  });

  it('全て最低は20', () => {
    expect(HealthLogEntity.getHealthTrendScore([1, 1, 1, 1])).toBe(20);
  });

  it('全て最高は100', () => {
    expect(HealthLogEntity.getHealthTrendScore([5, 5, 5, 5])).toBe(100);
  });

  it('中央値は60', () => {
    expect(HealthLogEntity.getHealthTrendScore([3, 3, 3])).toBe(60);
  });

  it('レベル2は40', () => {
    expect(HealthLogEntity.getHealthTrendScore([2])).toBe(40);
  });

  it('レベル4は80', () => {
    expect(HealthLogEntity.getHealthTrendScore([4])).toBe(80);
  });

  it('大量データで均一', () => {
    const data = Array(100).fill(3);
    expect(HealthLogEntity.getHealthTrendScore(data)).toBe(60);
  });

  it('体調が良いほどスコアが高い', () => {
    const low = HealthLogEntity.getHealthTrendScore([1, 2]);
    const high = HealthLogEntity.getHealthTrendScore([4, 5]);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = HealthLogEntity.getHealthTrendScore([2, 3, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('混合値', () => {
    // (1+5)/2 = 3 -> 3/5*100 = 60
    expect(HealthLogEntity.getHealthTrendScore([1, 5])).toBe(60);
  });
});

describe('HealthLogEntity.getHealthTrendScoreLabel - エッジケース', () => {
  it('100は良好', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(100)).toBe('良好');
  });

  it('80は良好', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(80)).toBe('良好');
  });

  it('79は普通', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(79)).toBe('普通');
  });

  it('50は普通', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(50)).toBe('普通');
  });

  it('49は注意', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(49)).toBe('注意');
  });

  it('0は注意', () => {
    expect(HealthLogEntity.getHealthTrendScoreLabel(0)).toBe('注意');
  });
});
