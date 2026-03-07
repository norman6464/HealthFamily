import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getDosageEfficiency', () => {
  it('処方量0は0', () => {
    expect(MedicationEntity.getDosageEfficiency(5, 0)).toBe(0);
  });

  it('実際量0は0', () => {
    expect(MedicationEntity.getDosageEfficiency(0, 10)).toBe(0);
  });

  it('同量は100', () => {
    expect(MedicationEntity.getDosageEfficiency(10, 10)).toBe(100);
  });

  it('半分は50', () => {
    expect(MedicationEntity.getDosageEfficiency(5, 10)).toBe(50);
  });

  it('処方以上は100にクランプ', () => {
    expect(MedicationEntity.getDosageEfficiency(15, 10)).toBe(100);
  });

  it('結果は0-100', () => {
    const result = MedicationEntity.getDosageEfficiency(7, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getDosageEfficiency(3, 7);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('負の実際量は0', () => {
    expect(MedicationEntity.getDosageEfficiency(-5, 10)).toBe(0);
  });

  it('負の処方量は0', () => {
    expect(MedicationEntity.getDosageEfficiency(5, -10)).toBe(0);
  });

  it('小数値', () => {
    const result = MedicationEntity.getDosageEfficiency(2.5, 5);
    expect(result).toBe(50);
  });

  it('実際量が増えるとスコアも上がる', () => {
    const score1 = MedicationEntity.getDosageEfficiency(3, 10);
    const score2 = MedicationEntity.getDosageEfficiency(7, 10);
    expect(score2).toBeGreaterThan(score1);
  });
});

describe('MedicationEntity.getDosageEfficiencyLabel', () => {
  it('80以上は良好', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(90)).toBe('良好');
  });

  it('50以上は普通', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(60)).toBe('普通');
  });

  it('50未満は不足', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(30)).toBe('不足');
  });
});
