import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseCompletionRate - エッジケース', () => {
  it('両方0は0', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(0, 0)).toBe(0);
  });

  it('完了0・予定1は0', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(0, 1)).toBe(0);
  });

  it('完了1・予定1は100', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(1, 1)).toBe(100);
  });

  it('完了1・予定0は100', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(1, 0)).toBe(100);
  });

  it('完了が予定を大幅に超えても100', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(100, 10)).toBe(100);
  });

  it('1/3は33', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(1, 3)).toBe(33);
  });

  it('2/3は67', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(2, 3)).toBe(67);
  });

  it('大きな数値', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(500, 1000)).toBe(50);
  });

  it('完了と予定が同じ', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(50, 50)).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationRecordEntity.getDoseCompletionRate(7, 15);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('完了が多いほど率が高い', () => {
    const low = MedicationRecordEntity.getDoseCompletionRate(1, 10);
    const high = MedicationRecordEntity.getDoseCompletionRate(9, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('予定が多いほど率が低い', () => {
    const low = MedicationRecordEntity.getDoseCompletionRate(5, 100);
    const high = MedicationRecordEntity.getDoseCompletionRate(5, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('ほぼ100%の場合', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(99, 100)).toBe(99);
  });
});

describe('MedicationRecordEntity.getDoseCompletionRateLabel - エッジケース', () => {
  it('率100は完璧', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(100)).toBe('完璧');
  });

  it('率90は完璧', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(90)).toBe('完璧');
  });

  it('率89は良好', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(89)).toBe('良好');
  });

  it('率70は良好', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(70)).toBe('良好');
  });

  it('率69は要改善', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(69)).toBe('要改善');
  });

  it('率0は要改善', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(0)).toBe('要改善');
  });
});
