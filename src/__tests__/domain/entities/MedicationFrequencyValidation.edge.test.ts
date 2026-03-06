import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity 頻度バリデーション エッジケース', () => {
  describe('validateFrequency', () => {
    it('大文字のDAILYは無効', () => {
      expect(MedicationEntity.validateFrequency('DAILY')).toBe(false);
    });

    it('スペース付きは無効', () => {
      expect(MedicationEntity.validateFrequency(' daily ')).toBe(false);
    });
  });

  describe('getAllFrequencies', () => {
    it('as_neededを含む', () => {
      const freqs = MedicationEntity.getAllFrequencies();
      expect(freqs.some((f) => f.id === 'as_needed')).toBe(true);
    });

    it('各ラベルが空でない', () => {
      const freqs = MedicationEntity.getAllFrequencies();
      for (const f of freqs) {
        expect(f.label.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getFrequencySummary', () => {
    it('未知の頻度コードはそのまま表示する', () => {
      const result = MedicationEntity.getFrequencySummary('custom_freq', '1錠');
      expect(result).toContain('custom_freq');
    });

    it('用量が空文字の場合は頻度のみ返す', () => {
      const result = MedicationEntity.getFrequencySummary('daily', '');
      expect(result).toBe('毎日');
    });
  });
});
