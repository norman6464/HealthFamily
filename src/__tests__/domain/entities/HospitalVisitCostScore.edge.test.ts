import { describe, it, expect } from 'vitest';
import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity.getHospitalVisitCostScore エッジケース', () => {
  it('負の費用は0', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(-5000)).toBe(0);
  });

  it('1円は0に近い', () => {
    const result = HospitalEntity.getHospitalVisitCostScore(1);
    expect(result).toBe(0);
  });

  it('100000円は100', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(100000)).toBe(100);
  });

  it('100000円超でも100以下', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(500000)).toBeLessThanOrEqual(100);
  });

  it('10000円は10', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(10000)).toBe(10);
  });

  it('小数の費用', () => {
    const result = HospitalEntity.getHospitalVisitCostScore(1234.56);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = HospitalEntity.getHospitalVisitCostScore(33333);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('費用が増えるとスコアが増える', () => {
    const low = HospitalEntity.getHospitalVisitCostScore(5000);
    const mid = HospitalEntity.getHospitalVisitCostScore(25000);
    const high = HospitalEntity.getHospitalVisitCostScore(75000);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });

  it('50000円は50', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(50000)).toBe(50);
  });

  it('非常に大きな費用は100', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(10000000)).toBe(100);
  });

  it('0.5円は0', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(0.5)).toBe(0);
  });

  it('99999円は100未満', () => {
    const result = HospitalEntity.getHospitalVisitCostScore(99999);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('HospitalEntity.getHospitalVisitCostScoreLabel エッジケース', () => {
  it('境界値70は高額', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(70)).toBe('高額');
  });

  it('境界値40は標準', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(40)).toBe('標準');
  });

  it('境界値69は標準', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(69)).toBe('標準');
  });

  it('境界値39は安価', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(39)).toBe('安価');
  });

  it('0は安価', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(0)).toBe('安価');
  });

  it('100は高額', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(100)).toBe('高額');
  });
});
