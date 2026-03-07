import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationOverlapCount', () => {
  it('0は0', () => {
    expect(MedicationEntity.getMedicationOverlapCount(0)).toBe(0);
  });

  it('1薬は低スコア', () => {
    const result = MedicationEntity.getMedicationOverlapCount(1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(30);
  });

  it('3薬は中程度', () => {
    const result = MedicationEntity.getMedicationOverlapCount(3);
    expect(result).toBeGreaterThan(20);
    expect(result).toBeLessThan(60);
  });

  it('5薬は高スコア', () => {
    const result = MedicationEntity.getMedicationOverlapCount(5);
    expect(result).toBeGreaterThan(40);
  });

  it('8薬以上は100', () => {
    expect(MedicationEntity.getMedicationOverlapCount(8)).toBe(100);
    expect(MedicationEntity.getMedicationOverlapCount(10)).toBe(100);
  });

  it('負の値は0', () => {
    expect(MedicationEntity.getMedicationOverlapCount(-3)).toBe(0);
  });

  it('結果は0-100', () => {
    const result = MedicationEntity.getMedicationOverlapCount(4);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getMedicationOverlapCount(3);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('数が増えるとスコアも増える', () => {
    const score1 = MedicationEntity.getMedicationOverlapCount(2);
    const score2 = MedicationEntity.getMedicationOverlapCount(5);
    expect(score2).toBeGreaterThan(score1);
  });

  it('6薬は75', () => {
    expect(MedicationEntity.getMedicationOverlapCount(6)).toBe(75);
  });
});

describe('MedicationEntity.getMedicationOverlapCountLabel', () => {
  it('70以上はリスク高', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(80)).toBe('リスク高');
  });

  it('40以上は注意', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(50)).toBe('注意');
  });

  it('40未満は安全', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(20)).toBe('安全');
  });
});
