import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getDoseVariability - エッジケース', () => {
  it('空配列は0', () => {
    expect(MedicationRecordEntity.getDoseVariability([])).toBe(0);
  });

  it('1件は0', () => {
    expect(MedicationRecordEntity.getDoseVariability([480])).toBe(0);
  });

  it('2件の同値は0', () => {
    expect(MedicationRecordEntity.getDoseVariability([480, 480])).toBe(0);
  });

  it('2件の異なる値', () => {
    const result = MedicationRecordEntity.getDoseVariability([400, 560]);
    expect(result).toBeGreaterThan(0);
  });

  it('全て同じは0', () => {
    expect(MedicationRecordEntity.getDoseVariability([100, 100, 100, 100])).toBe(0);
  });

  it('全て0は0', () => {
    expect(MedicationRecordEntity.getDoseVariability([0, 0, 0])).toBe(0);
  });

  it('結果は0-100', () => {
    const result = MedicationRecordEntity.getDoseVariability([100, 200, 300, 400]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('極端なばらつきでも100を超えない', () => {
    const result = MedicationRecordEntity.getDoseVariability([0, 1440]);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('微小な差', () => {
    const result = MedicationRecordEntity.getDoseVariability([480, 481, 479]);
    expect(result).toBeLessThan(5);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => 480 + (i % 10));
    const result = MedicationRecordEntity.getDoseVariability(data);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('ばらつき大 > ばらつき小', () => {
    const stable = MedicationRecordEntity.getDoseVariability([480, 481, 479, 480]);
    const unstable = MedicationRecordEntity.getDoseVariability([100, 500, 200, 800]);
    expect(unstable).toBeGreaterThan(stable);
  });

  it('負の値を含む場合', () => {
    const result = MedicationRecordEntity.getDoseVariability([-60, 0, 60]);
    expect(result).toBeGreaterThan(0);
  });

  it('3件の等差数列', () => {
    const result = MedicationRecordEntity.getDoseVariability([400, 480, 560]);
    expect(result).toBeGreaterThan(0);
  });

  it('同一値の長い配列は0', () => {
    const data = Array.from({ length: 50 }, () => 480);
    expect(MedicationRecordEntity.getDoseVariability(data)).toBe(0);
  });
});

describe('MedicationRecordEntity.getDoseVariabilityLabel - 境界値', () => {
  it('スコア0は安定', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(0)).toBe('安定');
  });

  it('スコア19は安定', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(19)).toBe('安定');
  });

  it('スコア20はやや不安定(境界値)', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(20)).toBe('やや不安定');
  });

  it('スコア49はやや不安定', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(49)).toBe('やや不安定');
  });

  it('スコア50は不安定(境界値)', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(50)).toBe('不安定');
  });

  it('スコア100は不安定', () => {
    expect(MedicationRecordEntity.getDoseVariabilityLabel(100)).toBe('不安定');
  });
});
