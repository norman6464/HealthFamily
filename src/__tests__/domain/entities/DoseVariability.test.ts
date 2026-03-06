import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseVariability', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseVariability([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MedicationRecordEntity.getDoseVariability([480])).toBe(0);
  });

  it('全て同じ時刻は0', () => {
    expect(MedicationRecordEntity.getDoseVariability([480, 480, 480])).toBe(0);
  });

  it('大きなばらつきは高スコア', () => {
    const result = MedicationRecordEntity.getDoseVariability([0, 120, 240, 360]);
    expect(result).toBeGreaterThan(50);
  });

  it('小さなばらつきは低スコア', () => {
    const result = MedicationRecordEntity.getDoseVariability([480, 482, 478, 481]);
    expect(result).toBeLessThan(20);
  });

  it('結果は0-100', () => {
    const result = MedicationRecordEntity.getDoseVariability([100, 200, 300]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('ばらつきが大きい方がスコアが高い', () => {
    const small = MedicationRecordEntity.getDoseVariability([480, 485, 490]);
    const large = MedicationRecordEntity.getDoseVariability([100, 400, 700]);
    expect(large).toBeGreaterThan(small);
  });
});

describe('MedicationRecordEntity.getDoseVariabilityLabel', () => {
  it('スコア20未満は安定', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(10)).toBe('安定');
  });

  it('スコア20-50はやや不安定', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(35)).toBe('やや不安定');
  });

  it('スコア50以上は不安定', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(60)).toBe('不安定');
  });
});
