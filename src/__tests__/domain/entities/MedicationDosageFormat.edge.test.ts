import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationDosageFormat エッジケース', () => {
  describe('formatDosageWithUnit', () => {
    it('大きな数値も表示できる', () => {
      expect(MedicationEntity.formatDosageWithUnit(1000, 'mg')).toBe('1000mg');
    });

    it('空の単位も許容する', () => {
      expect(MedicationEntity.formatDosageWithUnit(5, '')).toBe('5');
    });
  });

  describe('getDailyDosageTotal', () => {
    it('小数x小数も計算できる', () => {
      expect(MedicationEntity.getDailyDosageTotal(0.5, 0.5)).toBe(0.25);
    });

    it('大量の用量も計算できる', () => {
      expect(MedicationEntity.getDailyDosageTotal(10, 4)).toBe(40);
    });
  });

  describe('getDosageWarningLevel', () => {
    it('4.99はnormal（境界値）', () => {
      expect(MedicationEntity.getDosageWarningLevel(4.99)).toBe('normal');
    });

    it('5はmedium（境界値）', () => {
      expect(MedicationEntity.getDosageWarningLevel(5)).toBe('medium');
    });

    it('9.99はmedium（境界値）', () => {
      expect(MedicationEntity.getDosageWarningLevel(9.99)).toBe('medium');
    });

    it('10はhigh（境界値）', () => {
      expect(MedicationEntity.getDosageWarningLevel(10)).toBe('high');
    });
  });
});
