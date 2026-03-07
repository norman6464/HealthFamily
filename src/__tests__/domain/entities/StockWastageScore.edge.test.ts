import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getStockWastageScore エッジケース', () => {
  it('在庫1で残30日は低スコア', () => {
    const result = MedicationEntity.getStockWastageScore(1, 30);
    expect(result).toBeLessThan(10);
  });

  it('在庫100で残1日は高スコア', () => {
    const result = MedicationEntity.getStockWastageScore(100, 1);
    expect(result).toBe(100);
  });

  it('在庫5で残1日は100', () => {
    expect(MedicationEntity.getStockWastageScore(5, 1)).toBe(100);
  });

  it('在庫1で残1日は20', () => {
    expect(MedicationEntity.getStockWastageScore(1, 1)).toBe(20);
  });

  it('在庫0は常に0', () => {
    expect(MedicationEntity.getStockWastageScore(0, 1)).toBe(0);
    expect(MedicationEntity.getStockWastageScore(0, 100)).toBe(0);
  });

  it('残日数0は常に100（在庫ある場合）', () => {
    expect(MedicationEntity.getStockWastageScore(1, 0)).toBe(100);
    expect(MedicationEntity.getStockWastageScore(100, 0)).toBe(100);
  });

  it('非常に大きな在庫', () => {
    const result = MedicationEntity.getStockWastageScore(10000, 30);
    expect(result).toBe(100);
  });

  it('非常に大きな残日数', () => {
    const result = MedicationEntity.getStockWastageScore(10, 1000);
    expect(result).toBeLessThan(5);
  });

  it('小数の在庫', () => {
    const result = MedicationEntity.getStockWastageScore(0.5, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getStockWastageScore(33, 47);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('在庫増で残日数同じならスコア上がる', () => {
    const score1 = MedicationEntity.getStockWastageScore(10, 30);
    const score2 = MedicationEntity.getStockWastageScore(50, 30);
    expect(score2).toBeGreaterThanOrEqual(score1);
  });

  it('残日数増で在庫同じならスコア下がる', () => {
    const score1 = MedicationEntity.getStockWastageScore(50, 10);
    const score2 = MedicationEntity.getStockWastageScore(50, 60);
    expect(score1).toBeGreaterThan(score2);
  });

  it('負の在庫は0', () => {
    expect(MedicationEntity.getStockWastageScore(-50, 30)).toBe(0);
  });

  it('負の残日数は100', () => {
    expect(MedicationEntity.getStockWastageScore(50, -10)).toBe(100);
  });

  it('在庫5で残日数10', () => {
    expect(MedicationEntity.getStockWastageScore(5, 10)).toBe(10);
  });
});

describe('MedicationEntity.getStockWastageScoreLabel エッジケース', () => {
  it('境界値70は廃棄リスク高', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(70)).toBe('廃棄リスク高');
  });

  it('境界値40は注意', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(40)).toBe('注意');
  });

  it('境界値69は注意', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(69)).toBe('注意');
  });

  it('境界値39は低リスク', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(39)).toBe('低リスク');
  });

  it('0は低リスク', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(0)).toBe('低リスク');
  });

  it('100は廃棄リスク高', () => {
    expect(MedicationEntity.getStockWastageScoreLabel(100)).toBe('廃棄リスク高');
  });
});
