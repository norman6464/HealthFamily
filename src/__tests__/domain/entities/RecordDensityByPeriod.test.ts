import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getRecordDensityByPeriod', () => {
  it('記録0件は0', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(0, 30)).toBe(0);
  });

  it('日数0は0', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(10, 0)).toBe(0);
  });

  it('両方0は0', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(0, 0)).toBe(0);
  });

  it('1日1件は低スコア', () => {
    const result = MedicationRecordEntity.getRecordDensityByPeriod(30, 30);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });

  it('1日3件は中程度', () => {
    const result = MedicationRecordEntity.getRecordDensityByPeriod(90, 30);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(80);
  });

  it('1日5件以上は100', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(150, 30)).toBe(100);
  });

  it('結果は0-100', () => {
    const result = MedicationRecordEntity.getRecordDensityByPeriod(60, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationRecordEntity.getRecordDensityByPeriod(45, 30);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('負の記録数は0', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(-10, 30)).toBe(0);
  });

  it('記録が増えるとスコアも増える', () => {
    const score1 = MedicationRecordEntity.getRecordDensityByPeriod(10, 30);
    const score2 = MedicationRecordEntity.getRecordDensityByPeriod(50, 30);
    expect(score2).toBeGreaterThan(score1);
  });

  it('1日分', () => {
    const result = MedicationRecordEntity.getRecordDensityByPeriod(3, 1);
    expect(result).toBeGreaterThan(0);
  });
});

describe('MedicationRecordEntity.getRecordDensityByPeriodLabel', () => {
  it('70以上は高密度', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(80)).toBe('高密度');
  });

  it('40以上は標準', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(50)).toBe('標準');
  });

  it('40未満は低密度', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(20)).toBe('低密度');
  });
});
