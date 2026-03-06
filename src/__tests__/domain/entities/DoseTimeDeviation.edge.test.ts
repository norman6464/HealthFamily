import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseTimeDeviation - エッジケース', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviation([])).toBe(0);
  });

  it('1件のみは0', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviation([480])).toBe(0);
  });

  it('全て同じ時刻は0', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviation([480, 480, 480, 480])).toBe(0);
  });

  it('2件で差が小さい', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([480, 490]);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });

  it('2件で差が大きい', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([0, 1440]);
    expect(result).toBeGreaterThan(0);
  });

  it('全て0分', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviation([0, 0, 0])).toBe(0);
  });

  it('0分と1440分の組み合わせ', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([0, 1440]);
    expect(result).toBe(100);
  });

  it('小さなばらつきは低スコア', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([480, 481, 479, 480]);
    expect(result).toBeLessThan(5);
  });

  it('大きなばらつきは高スコア', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([60, 480, 900, 1200]);
    expect(result).toBeGreaterThan(50);
  });

  it('0-100の範囲内', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([100, 200, 300, 400, 500]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データでも正常に処理', () => {
    const data = Array.from({ length: 100 }, (_, i) => 480 + (i % 10));
    const result = MedicationRecordEntity.getDoseTimeDeviation(data);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('同じ2値の繰り返し', () => {
    const result = MedicationRecordEntity.getDoseTimeDeviation([480, 540, 480, 540, 480, 540]);
    expect(result).toBeGreaterThan(0);
  });

  it('ばらつきが小さい方がスコアが低い', () => {
    const small = MedicationRecordEntity.getDoseTimeDeviation([480, 485, 475]);
    const large = MedicationRecordEntity.getDoseTimeDeviation([480, 600, 360]);
    expect(small).toBeLessThan(large);
  });
});

describe('MedicationRecordEntity.getDoseTimeDeviationLabel - 境界値', () => {
  it('スコア0は正確', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(0)).toBe('正確');
  });

  it('スコア19は正確', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(19)).toBe('正確');
  });

  it('スコア20はやや不規則(境界値)', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(20)).toBe('やや不規則');
  });

  it('スコア49はやや不規則', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(49)).toBe('やや不規則');
  });

  it('スコア50は不規則(境界値)', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(50)).toBe('不規則');
  });

  it('スコア100は不規則', () => {
    expect(MedicationRecordEntity.getDoseTimeDeviationLabel(100)).toBe('不規則');
  });
});
