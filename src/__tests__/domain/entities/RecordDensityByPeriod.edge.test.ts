import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity.getRecordDensityByPeriod エッジケース', () => {
  it('1日1件は20', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(1, 1)).toBe(20);
  });

  it('1日5件は100', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(5, 1)).toBe(100);
  });

  it('1日10件でも100', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(10, 1)).toBe(100);
  });

  it('30日で30件は20', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(30, 30)).toBe(20);
  });

  it('30日で90件は60', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(90, 30)).toBe(60);
  });

  it('30日で150件は100', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(150, 30)).toBe(100);
  });

  it('負の記録数は0', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(-10, 30)).toBe(0);
  });

  it('負の日数は0', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(10, -5)).toBe(0);
  });

  it('両方負は0', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(-10, -5)).toBe(0);
  });

  it('結果は整数', () => {
    const result = MedicationRecordEntity.getRecordDensityByPeriod(33, 45);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('非常に大きな記録数は100', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(1000, 1)).toBe(100);
  });

  it('小数の記録数', () => {
    const result = MedicationRecordEntity.getRecordDensityByPeriod(2.5, 1);
    expect(result).toBe(50);
  });

  it('記録が増えるとスコアも増える', () => {
    const score1 = MedicationRecordEntity.getRecordDensityByPeriod(10, 30);
    const score2 = MedicationRecordEntity.getRecordDensityByPeriod(50, 30);
    expect(score2).toBeGreaterThan(score1);
  });

  it('日数が増えるとスコアは下がる', () => {
    const score1 = MedicationRecordEntity.getRecordDensityByPeriod(30, 10);
    const score2 = MedicationRecordEntity.getRecordDensityByPeriod(30, 60);
    expect(score1).toBeGreaterThan(score2);
  });

  it('7日で7件は20', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(7, 7)).toBe(20);
  });

  it('7日で14件は40', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(14, 7)).toBe(40);
  });

  it('365日で365件は20', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriod(365, 365)).toBe(20);
  });
});

describe('MedicationRecordEntity.getRecordDensityByPeriodLabel エッジケース', () => {
  it('境界値70は高密度', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(70)).toBe('高密度');
  });

  it('境界値40は標準', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(40)).toBe('標準');
  });

  it('境界値69は標準', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(69)).toBe('標準');
  });

  it('境界値39は低密度', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(39)).toBe('低密度');
  });

  it('0は低密度', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(0)).toBe('低密度');
  });

  it('100は高密度', () => {
    expect(MedicationRecordEntity.getRecordDensityByPeriodLabel(100)).toBe('高密度');
  });
});
