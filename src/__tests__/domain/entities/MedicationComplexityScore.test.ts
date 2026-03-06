import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationComplexityScore', () => {
  it('全て0は0', () => {
    expect(MedicationEntity.getMedicationComplexityScore(0, 0, 0)).toBe(0);
  });

  it('薬1種・1回・1回量は低い', () => {
    const result = MedicationEntity.getMedicationComplexityScore(1, 1, 1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(30);
  });

  it('薬が多いほどスコアが高い', () => {
    const low = MedicationEntity.getMedicationComplexityScore(1, 2, 1);
    const high = MedicationEntity.getMedicationComplexityScore(5, 2, 1);
    expect(high).toBeGreaterThan(low);
  });

  it('回数が多いほどスコアが高い', () => {
    const low = MedicationEntity.getMedicationComplexityScore(3, 1, 1);
    const high = MedicationEntity.getMedicationComplexityScore(3, 4, 1);
    expect(high).toBeGreaterThan(low);
  });

  it('種類数が多いほどスコアが高い', () => {
    const low = MedicationEntity.getMedicationComplexityScore(3, 2, 1);
    const high = MedicationEntity.getMedicationComplexityScore(3, 2, 3);
    expect(high).toBeGreaterThan(low);
  });

  it('最大100', () => {
    expect(MedicationEntity.getMedicationComplexityScore(20, 10, 10)).toBeLessThanOrEqual(100);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationEntity.getMedicationComplexityScore(3, 3, 2);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MedicationEntity.getMedicationComplexityScoreLabel', () => {
  it('スコア高は複雑', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(80)).toBe('複雑');
  });

  it('スコア中は普通', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(50)).toBe('普通');
  });

  it('スコア低はシンプル', () => {
    expect(MedicationEntity.getMedicationComplexityScoreLabel(20)).toBe('シンプル');
  });
});
