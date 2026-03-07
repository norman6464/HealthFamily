import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getStockWastageScore', () => {
  it('在庫0は0', () => {
    expect(MedicationEntity.getStockWastageScore(0, 30)).toBe(0);
  });

  it('残日数0は100', () => {
    expect(MedicationEntity.getStockWastageScore(100, 0)).toBe(100);
  });

  it('両方0は0', () => {
    expect(MedicationEntity.getStockWastageScore(0, 0)).toBe(0);
  });

  it('在庫多くて残日数少ないは高スコア', () => {
    const result = MedicationEntity.getStockWastageScore(100, 5);
    expect(result).toBeGreaterThan(50);
  });

  it('在庫少なくて残日数多いは低スコア', () => {
    const result = MedicationEntity.getStockWastageScore(5, 90);
    expect(result).toBeLessThan(30);
  });

  it('結果は0-100', () => {
    const result = MedicationEntity.getStockWastageScore(50, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getStockWastageScore(30, 45);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('負の在庫は0', () => {
    expect(MedicationEntity.getStockWastageScore(-10, 30)).toBe(0);
  });

  it('負の残日数は高スコア', () => {
    const result = MedicationEntity.getStockWastageScore(50, -5);
    expect(result).toBe(100);
  });

  it('在庫多いほどスコア高い（残日数同じ場合）', () => {
    const score1 = MedicationEntity.getStockWastageScore(10, 30);
    const score2 = MedicationEntity.getStockWastageScore(50, 30);
    expect(score2).toBeGreaterThanOrEqual(score1);
  });

  it('残日数が多いほどスコア低い（在庫同じ場合）', () => {
    const score1 = MedicationEntity.getStockWastageScore(50, 10);
    const score2 = MedicationEntity.getStockWastageScore(50, 60);
    expect(score1).toBeGreaterThan(score2);
  });
});

describe('MedicationEntity.getStockWastageScoreLabel', () => {
  it('70以上は廃棄リスク高', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(80)).toBe('廃棄リスク高');
  });

  it('40以上は注意', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(50)).toBe('注意');
  });

  it('40未満は低リスク', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(20)).toBe('低リスク');
  });
});
