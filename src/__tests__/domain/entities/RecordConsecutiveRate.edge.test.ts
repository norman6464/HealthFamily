import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getRecordConsecutiveRate - エッジケース', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([])).toBe(0);
  });

  it('1件trueは100', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true])).toBe(100);
  });

  it('1件falseは0', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([false])).toBe(0);
  });

  it('全てtrueは100', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true, true, true, true, true])).toBe(100);
  });

  it('全てfalseは0', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([false, false, false, false])).toBe(0);
  });

  it('半分は50', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true, false])).toBe(50);
  });

  it('1/3は33', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true, false, false])).toBe(33);
  });

  it('2/3は67', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true, true, false])).toBe(67);
  });

  it('大量データで全true', () => {
    const data = Array(100).fill(true);
    expect(MedicationRecordEntity.getRecordConsecutiveRate(data)).toBe(100);
  });

  it('大量データで全false', () => {
    const data = Array(100).fill(false);
    expect(MedicationRecordEntity.getRecordConsecutiveRate(data)).toBe(0);
  });

  it('trueが多いほどスコアが高い', () => {
    const low = MedicationRecordEntity.getRecordConsecutiveRate([true, false, false, false, false]);
    const high = MedicationRecordEntity.getRecordConsecutiveRate([true, true, true, true, false]);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = MedicationRecordEntity.getRecordConsecutiveRate([true, false, true, false, true]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('交互パターン', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRate([true, false, true, false])).toBe(50);
  });
});

describe('MedicationRecordEntity.getRecordConsecutiveRateLabel - エッジケース', () => {
  it('100は優秀', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(100)).toBe('優秀');
  });

  it('80は優秀', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(80)).toBe('優秀');
  });

  it('79は良好', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(79)).toBe('良好');
  });

  it('50は良好', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(50)).toBe('良好');
  });

  it('49は要改善', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(49)).toBe('要改善');
  });

  it('0は要改善', () => {
    expect(MedicationRecordEntity.getRecordConsecutiveRateLabel(0)).toBe('要改善');
  });
});
