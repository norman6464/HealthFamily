import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseTimeDeviation', () => {
  it('空配列は0を返す', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviation([])).toBe(0);
  });

  it('1件は0を返す', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviation([480])).toBe(0);
  });

  it('全て同じ時刻は0', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviation([480, 480, 480])).toBe(0);
  });

  it('ばらつきがあると正の値', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([480, 510, 450, 500]);
    expect(result).toBeGreaterThan(0);
  });

  it('大きなばらつきは高スコア', () => {
    const small = MedicationRecordEntity.getDoseTimeDeviation([480, 490, 470]);
    const large = MedicationRecordEntity.getDoseTimeDeviation([480, 600, 360]);
    expect(large).toBeGreaterThan(small);
  });

  it('0-100の範囲内', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([60, 720, 1200]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('2件でも計算可能', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([480, 540]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MedicationRecordEntity.getDoseTimeDeviationLabel', () => {
  it('スコア20未満は正確', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(10)).toBe('正確');
  });

  it('スコア50未満はやや不規則', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(30)).toBe('やや不規則');
  });

  it('スコア50以上は不規則', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(60)).toBe('不規則');
  });
});
