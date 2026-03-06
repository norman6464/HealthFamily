import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseTimingScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([])).toBe(0);
  });

  it('ずれ0は100', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([0])).toBe(100);
  });

  it('全てずれ0は100', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([0, 0, 0, 0])).toBe(100);
  });

  it('ずれ60分は0', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([60])).toBe(0);
  });

  it('ずれ30分は50', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([30])).toBe(50);
  });

  it('超過ずれは0', () => {
    expect(MedicationRecordEntity.getDoseTimingScore([120])).toBe(0);
  });

  it('負のずれは絶対値で扱う', () => {
    const pos = MedicationRecordEntity.getDoseTimingScore([15]);
    const neg = MedicationRecordEntity.getDoseTimingScore([-15]);
    expect(pos).toBe(neg);
  });

  it('ずれが少ないほどスコアが高い', () => {
    const accurate = MedicationRecordEntity.getDoseTimingScore([5, 5]);
    const inaccurate = MedicationRecordEntity.getDoseTimingScore([40, 40]);
    expect(accurate).toBeGreaterThan(inaccurate);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationRecordEntity.getDoseTimingScore([10, 20, 30]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('混在するずれ', () => {
    const result = MedicationRecordEntity.getDoseTimingScore([0, 60]);
    expect(result).toBe(50);
  });

  it('大量データ', () => {
    const data = Array(100).fill(0);
    expect(MedicationRecordEntity.getDoseTimingScore(data)).toBe(100);
  });

  it('小さなずれは高スコア', () => {
    const result = MedicationRecordEntity.getDoseTimingScore([3, 2, 1]);
    expect(result).toBeGreaterThan(90);
  });
});

describe('MedicationRecordEntity.getDoseTimingScoreLabel - エッジケース', () => {
  it('スコア100は正確', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(100)).toBe('正確');
  });

  it('スコア80は正確', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(80)).toBe('正確');
  });

  it('スコア79はやや遅れ', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(79)).toBe('やや遅れ');
  });

  it('スコア50はやや遅れ', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(50)).toBe('やや遅れ');
  });

  it('スコア49は遅れがち', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(49)).toBe('遅れがち');
  });

  it('スコア0は遅れがち', () => {
    expect(MedicationRecordEntity.getDoseTimingScoreLabel(0)).toBe('遅れがち');
  });
});
