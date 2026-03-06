import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseAccuracy - エッジケース', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([])).toBe(0);
  });

  it('1件の0分差は100', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([0])).toBe(100);
  });

  it('全て0分差は100', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([0, 0, 0, 0])).toBe(100);
  });

  it('全て120分差は0', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([120, 120, 120])).toBe(0);
  });

  it('全て60分差は50', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([60, 60, 60])).toBe(50);
  });

  it('混合した差分', () => {
    const result = MedicationRecordEntity.getDoseAccuracy([0, 30, 60]);
    expect(result).toBe(75);
  });

  it('0-100の範囲内', () => {
    const result = MedicationRecordEntity.getDoseAccuracy([10, 20, 30, 40, 50]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('120分超でも0を下回らない', () => {
    const result = MedicationRecordEntity.getDoseAccuracy([200, 200, 200]);
    expect(result).toBe(0);
  });

  it('差が小さい方がスコアが高い', () => {
    const accurate = MedicationRecordEntity.getDoseAccuracy([5, 5, 5]);
    const late = MedicationRecordEntity.getDoseAccuracy([60, 60, 60]);
    expect(accurate).toBeGreaterThan(late);
  });

  it('1件の30分差', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([30])).toBe(75);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, () => 10);
    const result = MedicationRecordEntity.getDoseAccuracy(data);
    expect(result).toBeGreaterThan(90);
  });

  it('2件の異なる差分', () => {
    const result = MedicationRecordEntity.getDoseAccuracy([0, 60]);
    expect(result).toBe(75);
  });
});

describe('MedicationRecordEntity.getDoseAccuracyLabel - 境界値', () => {
  it('スコア80は正確(境界値)', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(80)).toBe('正確');
  });

  it('スコア79はやや遅れ', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(79)).toBe('やや遅れ');
  });

  it('スコア50はやや遅れ(境界値)', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(50)).toBe('やや遅れ');
  });

  it('スコア49は不正確', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(49)).toBe('不正確');
  });

  it('スコア0は不正確', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(0)).toBe('不正確');
  });

  it('スコア100は正確', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(100)).toBe('正確');
  });
});
