import { describe, it, expect } from 'vitest';
import { HospitalEntity } from '@/domain/entities/Hospital';

describe('HospitalEntity.getHospitalVisitCostScore', () => {
  it('費用0は0', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(0)).toBe(0);
  });

  it('低費用は低スコア', () => {
    const result = HospitalEntity.getHospitalVisitCostScore(1000);
    expect(result).toBeLessThan(50);
  });

  it('高費用は高スコア', () => {
    const result = HospitalEntity.getHospitalVisitCostScore(60000);
    expect(result).toBeGreaterThan(50);
  });

  it('費用が高いほどスコアが高い', () => {
    const low = HospitalEntity.getHospitalVisitCostScore(3000);
    const high = HospitalEntity.getHospitalVisitCostScore(30000);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = HospitalEntity.getHospitalVisitCostScore(10000);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('超過しても100以下', () => {
    expect(HospitalEntity.getHospitalVisitCostScore(1000000)).toBeLessThanOrEqual(100);
  });
});

describe('HospitalEntity.getHospitalVisitCostScoreLabel', () => {
  it('スコア高は高額', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(85)).toBe('高額');
  });

  it('スコア中は標準', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(55)).toBe('標準');
  });

  it('スコア低は安価', () => {
    expect(HospitalEntity.getHospitalVisitCostScoreLabel(25)).toBe('安価');
  });
});
