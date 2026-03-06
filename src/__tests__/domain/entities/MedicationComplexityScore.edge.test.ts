import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationComplexityScore - エッジケース', () => {
  it('全て0は0', () => {
    expect(MedicationEntity.getMedicationComplexityScore(0, 0, 0)).toBe(0);
  });

  it('薬1・回1・種1', () => {
    const result = MedicationEntity.getMedicationComplexityScore(1, 1, 1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(30);
  });

  it('最大値全て', () => {
    expect(MedicationEntity.getMedicationComplexityScore(10, 6, 5)).toBe(100);
  });

  it('超過しても100', () => {
    expect(MedicationEntity.getMedicationComplexityScore(20, 12, 10)).toBe(100);
  });

  it('薬のみ', () => {
    const result = MedicationEntity.getMedicationComplexityScore(5, 0, 0);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });

  it('回数のみ', () => {
    const result = MedicationEntity.getMedicationComplexityScore(0, 3, 0);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });

  it('種類のみ', () => {
    const result = MedicationEntity.getMedicationComplexityScore(0, 0, 3);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });

  it('薬が多いほどスコアが高い', () => {
    const low = MedicationEntity.getMedicationComplexityScore(1, 2, 1);
    const high = MedicationEntity.getMedicationComplexityScore(8, 2, 1);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationEntity.getMedicationComplexityScore(3, 2, 2);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MedicationEntity.getMedicationComplexityScoreLabel - エッジケース', () => {
  it('100は複雑', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(100)).toBe('複雑');
  });

  it('70は複雑', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(70)).toBe('複雑');
  });

  it('69は普通', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(69)).toBe('普通');
  });

  it('40は普通', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(40)).toBe('普通');
  });

  it('39はシンプル', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(39)).toBe('シンプル');
  });

  it('0はシンプル', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(0)).toBe('シンプル');
  });
});
