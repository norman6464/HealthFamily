import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseGapVariability', () => {
  it('空配列は0を返す', () => {
    expect(MedicationRecordEntity.getDoseGapVariability([])).toBe(0);
  });

  it('1件のみは0を返す', () => {
    expect(MedicationRecordEntity.getDoseGapVariability([60])).toBe(0);
  });

  it('全て同じ間隔は0を返す', () => {
    expect(MedicationRecordEntity.getDoseGapVariability([60, 60, 60])).toBe(0);
  });

  it('間隔が均一に近いほど低スコア', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([58, 60, 62]);
    expect(result).toBeLessThan(20);
  });

  it('間隔がばらつく場合は高スコア', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([30, 120, 30, 120]);
    expect(result).toBeGreaterThan(50);
  });

  it('0-100の範囲内に収まる', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([1, 1000, 1, 1000]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件で異なる値はばらつきあり', () => {
    const result = MedicationRecordEntity.getDoseGapVariability([30, 90]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MedicationRecordEntity.getDoseGapVariabilityLabel', () => {
  it('スコア0は規則的', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(0)).toBe('規則的');
  });

  it('スコア40はやや不規則', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(40)).toBe('やや不規則');
  });

  it('スコア70は不規則', () => {
    expect(MedicationRecordEntity.getDoseGapVariabilityLabel(70)).toBe('不規則');
  });
});
