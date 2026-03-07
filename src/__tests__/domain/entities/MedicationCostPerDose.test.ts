import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationCostPerDose', () => {
  it('総額0は0', () => {
    expect(MedicationEntity.getMedicationCostPerDose(0, 30)).toBe(0);
  });

  it('回数0は0', () => {
    expect(MedicationEntity.getMedicationCostPerDose(3000, 0)).toBe(0);
  });

  it('両方0は0', () => {
    expect(MedicationEntity.getMedicationCostPerDose(0, 0)).toBe(0);
  });

  it('3000円/30回は100', () => {
    expect(MedicationEntity.getMedicationCostPerDose(3000, 30)).toBe(100);
  });

  it('回数が多いほど単価が下がる', () => {
    const few = MedicationEntity.getMedicationCostPerDose(3000, 10);
    const many = MedicationEntity.getMedicationCostPerDose(3000, 30);
    expect(few).toBeGreaterThan(many);
  });

  it('結果は0以上', () => {
    const result = MedicationEntity.getMedicationCostPerDose(5000, 60);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('小数点以下2桁まで', () => {
    const result = MedicationEntity.getMedicationCostPerDose(1000, 3);
    expect(result).toBe(Math.round((1000 / 3) * 100) / 100);
  });

  it('負の総額は0', () => {
    expect(MedicationEntity.getMedicationCostPerDose(-1000, 30)).toBe(0);
  });

  it('結果は数値', () => {
    const result = MedicationEntity.getMedicationCostPerDose(2500, 25);
    expect(typeof result).toBe('number');
  });
});

describe('MedicationEntity.getMedicationCostPerDoseLabel', () => {
  it('高い値は高コスト', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(600)).toBe('高コスト');
  });

  it('中程度は標準', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(150)).toBe('標準');
  });

  it('低い値は低コスト', () => {
    expect(MedicationEntity.getMedicationCostPerDoseLabel(30)).toBe('低コスト');
  });
});
