import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseAccuracy', () => {
  it('空配列は0を返す', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([])).toBe(0);
  });

  it('全て0分差は100', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([0, 0, 0])).toBe(100);
  });

  it('全て30分差', () => {
    const result = MedicationRecordEntity.getDoseAccuracy([30, 30, 30]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });

  it('差が大きいほどスコアが低い', () => {
    const small = MedicationRecordEntity.getDoseAccuracy([5, 5, 5]);
    const large = MedicationRecordEntity.getDoseAccuracy([60, 60, 60]);
    expect(small).toBeGreaterThan(large);
  });

  it('0-100の範囲内', () => {
    const result = MedicationRecordEntity.getDoseAccuracy([10, 20, 30, 40]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('1件でも計算可能', () => {
    expect(MedicationRecordEntity.getDoseAccuracy([0])).toBe(100);
  });

  it('非常に大きな差は0に近い', () => {
    const result = MedicationRecordEntity.getDoseAccuracy([120, 120, 120]);
    expect(result).toBeLessThanOrEqual(0);
  });
});

describe('MedicationRecordEntity.getDoseAccuracyLabel', () => {
  it('スコア80以上は正確', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(85)).toBe('正確');
  });

  it('スコア50以上はやや遅れ', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(60)).toBe('やや遅れ');
  });

  it('スコア50未満は不正確', () => {
    expect(MedicationRecordEntity.getDoseAccuracyLabel(30)).toBe('不正確');
  });
});
