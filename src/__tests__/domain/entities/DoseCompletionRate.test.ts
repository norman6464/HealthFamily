import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseCompletionRate', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(0, 0)).toBe(0);
  });

  it('完了0・予定ありは0', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(0, 10)).toBe(0);
  });

  it('全て完了は100', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(10, 10)).toBe(100);
  });

  it('半分完了は50', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(5, 10)).toBe(50);
  });

  it('予定0は100', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(5, 0)).toBe(100);
  });

  it('完了が予定を超えた場合は100', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(15, 10)).toBe(100);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationRecordEntity.getDoseCompletionRate(3, 7);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1件中1件完了は100', () => {
    expect(MedicationRecordEntity.getDoseCompletionRate(1, 1)).toBe(100);
  });

  it('完了が多いほど率が高い', () => {
    const low = MedicationRecordEntity.getDoseCompletionRate(2, 10);
    const high = MedicationRecordEntity.getDoseCompletionRate(8, 10);
    expect(high).toBeGreaterThan(low);
  });
});

describe('MedicationRecordEntity.getDoseCompletionRateLabel', () => {
  it('率90以上は完璧', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(95)).toBe('完璧');
  });

  it('率70-90は良好', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(75)).toBe('良好');
  });

  it('率70未満は要改善', () => {
    expect(MedicationRecordEntity.getDoseCompletionRateLabel(50)).toBe('要改善');
  });
});
