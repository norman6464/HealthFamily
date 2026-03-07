import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity.getMedicationOverlapCount エッジケース', () => {
  it('0薬は0', () => {
    expect(MedicationEntity.getMedicationOverlapCount(0)).toBe(0);
  });

  it('1薬は13', () => {
    expect(MedicationEntity.getMedicationOverlapCount(1)).toBe(13);
  });

  it('2薬は25', () => {
    expect(MedicationEntity.getMedicationOverlapCount(2)).toBe(25);
  });

  it('4薬は50', () => {
    expect(MedicationEntity.getMedicationOverlapCount(4)).toBe(50);
  });

  it('6薬は75', () => {
    expect(MedicationEntity.getMedicationOverlapCount(6)).toBe(75);
  });

  it('8薬は100', () => {
    expect(MedicationEntity.getMedicationOverlapCount(8)).toBe(100);
  });

  it('10薬でも100', () => {
    expect(MedicationEntity.getMedicationOverlapCount(10)).toBe(100);
  });

  it('負の値は0', () => {
    expect(MedicationEntity.getMedicationOverlapCount(-5)).toBe(0);
  });

  it('小数の薬数', () => {
    const result = MedicationEntity.getMedicationOverlapCount(3.5);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('結果は整数', () => {
    const result = MedicationEntity.getMedicationOverlapCount(3);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('数が増えるとスコアも増える', () => {
    for (let i = 1; i < 8; i++) {
      expect(MedicationEntity.getMedicationOverlapCount(i + 1))
        .toBeGreaterThanOrEqual(MedicationEntity.getMedicationOverlapCount(i));
    }
  });

  it('5薬は63', () => {
    expect(MedicationEntity.getMedicationOverlapCount(5)).toBe(63);
  });

  it('7薬は88', () => {
    expect(MedicationEntity.getMedicationOverlapCount(7)).toBe(88);
  });

  it('3薬は38', () => {
    expect(MedicationEntity.getMedicationOverlapCount(3)).toBe(38);
  });

  it('非常に大きな値は100', () => {
    expect(MedicationEntity.getMedicationOverlapCount(100)).toBe(100);
  });
});

describe('MedicationEntity.getMedicationOverlapCountLabel エッジケース', () => {
  it('境界値70はリスク高', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(70)).toBe('リスク高');
  });

  it('境界値40は注意', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(40)).toBe('注意');
  });

  it('境界値69は注意', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(69)).toBe('注意');
  });

  it('境界値39は安全', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(39)).toBe('安全');
  });

  it('0は安全', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(0)).toBe('安全');
  });

  it('100はリスク高', () => {
    expect(MedicationEntity.getMedicationOverlapCountLabel(100)).toBe('リスク高');
  });
});
