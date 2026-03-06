import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity 用量フォーマット', () => {
  describe('formatDosageWithUnit', () => {
    it('用量と単位を結合する', () => {
      expect(MedicationEntity.formatDosageWithUnit(1, '錠')).toBe('1錠');
    });

    it('小数を含む用量を表示する', () => {
      expect(MedicationEntity.formatDosageWithUnit(0.5, '錠')).toBe('0.5錠');
    });

    it('用量0の場合は0を表示する', () => {
      expect(MedicationEntity.formatDosageWithUnit(0, '錠')).toBe('0錠');
    });

    it('ml単位の場合', () => {
      expect(MedicationEntity.formatDosageWithUnit(5, 'ml')).toBe('5ml');
    });
  });

  describe('getDailyDosageTotal', () => {
    it('1回2錠x3回で6を返す', () => {
      expect(MedicationEntity.getDailyDosageTotal(2, 3)).toBe(6);
    });

    it('1回0.5錠x2回で1を返す', () => {
      expect(MedicationEntity.getDailyDosageTotal(0.5, 2)).toBe(1);
    });

    it('回数0の場合は0を返す', () => {
      expect(MedicationEntity.getDailyDosageTotal(2, 0)).toBe(0);
    });

    it('用量0の場合は0を返す', () => {
      expect(MedicationEntity.getDailyDosageTotal(0, 3)).toBe(0);
    });
  });

  describe('getDosageWarningLevel', () => {
    it('日用量10以上はhighを返す', () => {
      expect(MedicationEntity.getDosageWarningLevel(12)).toBe('high');
    });

    it('日用量5以上10未満はmediumを返す', () => {
      expect(MedicationEntity.getDosageWarningLevel(7)).toBe('medium');
    });

    it('日用量5未満はnormalを返す', () => {
      expect(MedicationEntity.getDosageWarningLevel(3)).toBe('normal');
    });

    it('日用量0はnormalを返す', () => {
      expect(MedicationEntity.getDosageWarningLevel(0)).toBe('normal');
    });
  });
});
