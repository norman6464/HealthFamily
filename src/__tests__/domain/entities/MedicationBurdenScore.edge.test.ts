import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationBurdenScore エッジケース', () => {
  it('0回は0', () => {
    expect(MedicationEntity.getMedicationBurdenScore(0)).toBe(0);
  });

  it('負の大きな値は0', () => {
    expect(MedicationEntity.getMedicationBurdenScore(-100)).toBe(0);
  });

  it('1日1回は10', () => {
    expect(MedicationEntity.getMedicationBurdenScore(1)).toBe(10);
  });

  it('1日5回は50', () => {
    expect(MedicationEntity.getMedicationBurdenScore(5)).toBe(50);
  });

  it('1日10回は100', () => {
    expect(MedicationEntity.getMedicationBurdenScore(10)).toBe(100);
  });

  it('1日20回でも100', () => {
    expect(MedicationEntity.getMedicationBurdenScore(20)).toBe(100);
  });

  it('小数の回数', () => {
    const result = MedicationEntity.getMedicationBurdenScore(3.5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getMedicationBurdenScore(3);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('1日2回は20', () => {
    expect(MedicationEntity.getMedicationBurdenScore(2)).toBe(20);
  });

  it('1日7回は70', () => {
    expect(MedicationEntity.getMedicationBurdenScore(7)).toBe(70);
  });

  it('回数が増えるとスコアも増える', () => {
    for (let i = 1; i < 10; i++) {
      expect(MedicationEntity.getMedicationBurdenScore(i + 1))
        .toBeGreaterThanOrEqual(MedicationEntity.getMedicationBurdenScore(i));
    }
  });

  it('非常に大きな値は100', () => {
    expect(MedicationEntity.getMedicationBurdenScore(999)).toBe(100);
  });

  it('0.1回は低いスコア', () => {
    const result = MedicationEntity.getMedicationBurdenScore(0.1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(10);
  });

  it('9回は90', () => {
    expect(MedicationEntity.getMedicationBurdenScore(9)).toBe(90);
  });

  it('4回は40', () => {
    expect(MedicationEntity.getMedicationBurdenScore(4)).toBe(40);
  });

  it('6回は60', () => {
    expect(MedicationEntity.getMedicationBurdenScore(6)).toBe(60);
  });

  it('8回は80', () => {
    expect(MedicationEntity.getMedicationBurdenScore(8)).toBe(80);
  });
});

describe('MedicationEntity.getMedicationBurdenScoreLabel エッジケース', () => {
  it('境界値70は負担大', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(70)).toBe('負担大');
  });

  it('境界値40は普通', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(40)).toBe('普通');
  });

  it('境界値69は普通', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(69)).toBe('普通');
  });

  it('境界値39は負担小', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(39)).toBe('負担小');
  });

  it('0は負担小', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(0)).toBe('負担小');
  });

  it('100は負担大', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(100)).toBe('負担大');
  });
});
