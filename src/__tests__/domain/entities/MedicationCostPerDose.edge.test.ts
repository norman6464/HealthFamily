import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationCostPerDose エッジケース', () => {
  it('負の回数は0', () => {
    expect(MedicationEntity.getMedicationCostPerDose(3000, -5)).toBe(0);
  });

  it('両方負は0', () => {
    expect(MedicationEntity.getMedicationCostPerDose(-1000, -10)).toBe(0);
  });

  it('1回あたり1円', () => {
    expect(MedicationEntity.getMedicationCostPerDose(1, 1)).toBe(1);
  });

  it('非常に大きな金額', () => {
    const result = MedicationEntity.getMedicationCostPerDose(1000000, 100);
    expect(result).toBe(10000);
  });

  it('小数点の金額', () => {
    const result = MedicationEntity.getMedicationCostPerDose(100.5, 3);
    expect(result).toBe(Math.round((100.5 / 3) * 100) / 100);
  });

  it('回数1は総額そのまま', () => {
    expect(MedicationEntity.getMedicationCostPerDose(5000, 1)).toBe(5000);
  });

  it('大きな回数で小さな単価', () => {
    const result = MedicationEntity.getMedicationCostPerDose(100, 1000);
    expect(result).toBe(0.1);
  });

  it('同額同数は1', () => {
    expect(MedicationEntity.getMedicationCostPerDose(50, 50)).toBe(1);
  });

  it('結果は小数点以下2桁まで', () => {
    const result = MedicationEntity.getMedicationCostPerDose(1000, 7);
    const decimalPlaces = (result.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('非常に小さな金額', () => {
    const result = MedicationEntity.getMedicationCostPerDose(0.01, 1);
    expect(result).toBe(0.01);
  });

  it('金額0で回数正は0', () => {
    expect(MedicationEntity.getMedicationCostPerDose(0, 100)).toBe(0);
  });
});

describe('MedicationEntity.getMedicationCostPerDoseLabel エッジケース', () => {
  it('境界値500は高コスト', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(500)).toBe('高コスト');
  });

  it('境界値100は標準', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(100)).toBe('標準');
  });

  it('境界値499は標準', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(499)).toBe('標準');
  });

  it('境界値99は低コスト', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(99)).toBe('低コスト');
  });

  it('0は低コスト', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(0)).toBe('低コスト');
  });

  it('10000は高コスト', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(10000)).toBe('高コスト');
  });
});
