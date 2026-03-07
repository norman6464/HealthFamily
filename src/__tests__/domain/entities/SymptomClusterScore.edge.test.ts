import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity.getSymptomClusterScore エッジケース', () => {
  it('全て0は0', () => {
    expect(HealthLogEntity.getSymptomClusterScore([0, 0, 0])).toBe(0);
  });

  it('全て1は20', () => {
    expect(HealthLogEntity.getSymptomClusterScore([1, 1, 1])).toBe(20);
  });

  it('全て5は100', () => {
    expect(HealthLogEntity.getSymptomClusterScore([5, 5, 5])).toBe(100);
  });

  it('1要素で0は0', () => {
    expect(HealthLogEntity.getSymptomClusterScore([0])).toBe(0);
  });

  it('1要素で5は100', () => {
    expect(HealthLogEntity.getSymptomClusterScore([5])).toBe(100);
  });

  it('負の値は0として扱われる', () => {
    const result = HealthLogEntity.getSymptomClusterScore([-3, 2, 4]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('5以上の値', () => {
    const result = HealthLogEntity.getSymptomClusterScore([10, 10]);
    expect(result).toBe(100);
  });

  it('小数値', () => {
    const result = HealthLogEntity.getSymptomClusterScore([2.5, 2.5]);
    expect(result).toBe(50);
  });

  it('結果は整数', () => {
    const result = HealthLogEntity.getSymptomClusterScore([1, 2, 3]);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('多数の要素', () => {
    const counts = Array.from({ length: 100 }, () => 3);
    expect(HealthLogEntity.getSymptomClusterScore(counts)).toBe(60);
  });

  it('0と5の混在', () => {
    const result = HealthLogEntity.getSymptomClusterScore([0, 5, 0, 5]);
    expect(result).toBe(50);
  });

  it('ばらつきのある値', () => {
    const result = HealthLogEntity.getSymptomClusterScore([1, 3, 5, 2, 4]);
    expect(result).toBe(60);
  });

  it('全て2は40', () => {
    expect(HealthLogEntity.getSymptomClusterScore([2, 2, 2])).toBe(40);
  });

  it('全て3は60', () => {
    expect(HealthLogEntity.getSymptomClusterScore([3, 3, 3])).toBe(60);
  });

  it('全て4は80', () => {
    expect(HealthLogEntity.getSymptomClusterScore([4, 4, 4])).toBe(80);
  });

  it('増加パターン', () => {
    const result = HealthLogEntity.getSymptomClusterScore([1, 2, 3, 4, 5]);
    expect(result).toBe(60);
  });
});

describe('HealthLogEntity.getSymptomClusterScoreLabel エッジケース', () => {
  it('境界値70は集中的', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(70)).toBe('集中的');
  });

  it('境界値40はやや集中', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(40)).toBe('やや集中');
  });

  it('境界値69はやや集中', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(69)).toBe('やや集中');
  });

  it('境界値39は分散的', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(39)).toBe('分散的');
  });

  it('0は分散的', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(0)).toBe('分散的');
  });

  it('100は集中的', () => {
    expect(HealthLogEntity.getSymptomClusterScoreLabel(100)).toBe('集中的');
  });
});
