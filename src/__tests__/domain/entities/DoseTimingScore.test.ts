import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseTimingScore', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([])).toBe(0);
  });

  it('ずれなしは100', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([0, 0, 0])).toBe(100);
  });

  it('1件ずれなしは100', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([0])).toBe(100);
  });

  it('大きなずれはスコアが低い', () => {
    const result = MedicationRecordEntity.getDoseTimingScore([60, 60, 60]);
    expect(result).toBeLessThan(50);
  });

  it('小さなずれはスコアが高い', () => {
    const result = MedicationRecordEntity.getDoseTimingScore([5, 5, 5]);
    expect(result).toBeGreaterThan(80);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationRecordEntity.getDoseTimingScore([10, 20, 30]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('ずれが少ないほどスコアが高い', () => {
    const accurate = MedicationRecordEntity.getDoseTimingScore([5, 5, 5]);
    const inaccurate = MedicationRecordEntity.getDoseTimingScore([30, 30, 30]);
    expect(accurate).toBeGreaterThan(inaccurate);
  });

  it('負のずれは絶対値で扱う', () => {
    const pos = MedicationRecordEntity.getDoseTimingScore([10]);
    const neg = MedicationRecordEntity.getDoseTimingScore([-10]);
    expect(pos).toBe(neg);
  });
});

describe('MedicationRecordEntity.getDoseTimingScoreLabel', () => {
  it('スコア高は正確', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(85)).toBe('正確');
  });

  it('スコア中はやや遅れ', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(55)).toBe('やや遅れ');
  });

  it('スコア低は遅れがち', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(25)).toBe('遅れがち');
  });
});
