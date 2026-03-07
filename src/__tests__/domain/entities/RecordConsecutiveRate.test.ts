import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getRecordConsecutiveRate', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([])).toBe(0);
  });

  it('全てtrueは100', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true, true, true])).toBe(100);
  });

  it('全てfalseは0', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([false, false, false])).toBe(0);
  });

  it('半分は50', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true, false, true, false])).toBe(50);
  });

  it('1件trueは100', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true])).toBe(100);
  });

  it('率が高いほどスコアが高い', () => {
    const low = MedicationRecordEntity.getRecordConsecutiveRate([true, false, false, false, false]);
    const high = MedicationRecordEntity.getRecordConsecutiveRate([true, true, true, true, false]);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationRecordEntity.getRecordConsecutiveRate([true, false, true]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('MedicationRecordEntity.getRecordConsecutiveRateLabel', () => {
  it('高い率は優秀', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(90)).toBe('優秀');
  });

  it('中程度は良好', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(60)).toBe('良好');
  });

  it('低い率は要改善', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(30)).toBe('要改善');
  });
});
