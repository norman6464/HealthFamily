import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getDosageEfficiency エッジケース', () => {
  it('両方0は0', () => {
    expect(MedicationEntity.getDosageEfficiency(0, 0)).toBe(0);
  });

  it('実際量0は0', () => {
    expect(MedicationEntity.getDosageEfficiency(0, 100)).toBe(0);
  });

  it('処方量0は0', () => {
    expect(MedicationEntity.getDosageEfficiency(100, 0)).toBe(0);
  });

  it('同量は100', () => {
    expect(MedicationEntity.getDosageEfficiency(50, 50)).toBe(100);
  });

  it('2倍でも100にクランプ', () => {
    expect(MedicationEntity.getDosageEfficiency(200, 100)).toBe(100);
  });

  it('10%は10', () => {
    expect(MedicationEntity.getDosageEfficiency(1, 10)).toBe(10);
  });

  it('25%は25', () => {
    expect(MedicationEntity.getDosageEfficiency(25, 100)).toBe(25);
  });

  it('75%は75', () => {
    expect(MedicationEntity.getDosageEfficiency(75, 100)).toBe(75);
  });

  it('小数値で正確', () => {
    expect(MedicationEntity.getDosageEfficiency(2.5, 5)).toBe(50);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getDosageEfficiency(3, 7);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('負の実際量は0', () => {
    expect(MedicationEntity.getDosageEfficiency(-10, 20)).toBe(0);
  });

  it('負の処方量は0', () => {
    expect(MedicationEntity.getDosageEfficiency(10, -20)).toBe(0);
  });

  it('非常に大きな値', () => {
    expect(MedicationEntity.getDosageEfficiency(1000000, 1000000)).toBe(100);
  });

  it('非常に小さな値', () => {
    const result = MedicationEntity.getDosageEfficiency(0.001, 0.01);
    expect(result).toBe(10);
  });

  it('実際量が増えるとスコアも上がる', () => {
    for (let i = 1; i < 10; i++) {
      expect(MedicationEntity.getDosageEfficiency(i + 1, 10))
        .toBeGreaterThanOrEqual(MedicationEntity.getDosageEfficiency(i, 10));
    }
  });

  it('90%は90', () => {
    expect(MedicationEntity.getDosageEfficiency(9, 10)).toBe(90);
  });
});

describe('MedicationEntity.getDosageEfficiencyLabel エッジケース', () => {
  it('境界値80は良好', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(80)).toBe('良好');
  });

  it('境界値50は普通', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(50)).toBe('普通');
  });

  it('境界値79は普通', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(79)).toBe('普通');
  });

  it('境界値49は不足', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(49)).toBe('不足');
  });

  it('0は不足', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(0)).toBe('不足');
  });

  it('100は良好', () => {
    expect(MedicationEntity.getDosageEfficiencyLabel(100)).toBe('良好');
  });
});
