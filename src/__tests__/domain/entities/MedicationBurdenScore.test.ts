import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationBurdenScore', () => {
  it('0回は0', () => {
    expect(MedicationEntity.getMedicationBurdenScore(0)).toBe(0);
  });

  it('負の回数は0', () => {
    expect(MedicationEntity.getMedicationBurdenScore(-3)).toBe(0);
  });

  it('1日1回は低いスコア', () => {
    const result = MedicationEntity.getMedicationBurdenScore(1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(30);
  });

  it('1日3回は中程度', () => {
    const result = MedicationEntity.getMedicationBurdenScore(3);
    expect(result).toBeGreaterThan(20);
    expect(result).toBeLessThan(60);
  });

  it('1日6回は高いスコア', () => {
    const result = MedicationEntity.getMedicationBurdenScore(6);
    expect(result).toBeGreaterThan(50);
  });

  it('1日10回以上は100', () => {
    expect(MedicationEntity.getMedicationBurdenScore(10)).toBe(100);
    expect(MedicationEntity.getMedicationBurdenScore(15)).toBe(100);
  });

  it('結果は0-100', () => {
    const result = MedicationEntity.getMedicationBurdenScore(5);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getMedicationBurdenScore(4);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('回数が増えるとスコアも増える', () => {
    const score1 = MedicationEntity.getMedicationBurdenScore(2);
    const score2 = MedicationEntity.getMedicationBurdenScore(5);
    expect(score2).toBeGreaterThan(score1);
  });

  it('1日8回は高スコア', () => {
    const result = MedicationEntity.getMedicationBurdenScore(8);
    expect(result).toBeGreaterThan(70);
  });
});

describe('MedicationEntity.getMedicationBurdenScoreLabel', () => {
  it('70以上は負担大', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(80)).toBe('負担大');
  });

  it('40以上は普通', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(50)).toBe('普通');
  });

  it('40未満は負担小', () => {
    expect(MedicationEntity.getMedicationBurdenScoreLabel(20)).toBe('負担小');
  });
});
