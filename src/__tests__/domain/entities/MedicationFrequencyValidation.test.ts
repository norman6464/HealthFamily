import { describe, it, expect } from 'vitest';
import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity 頻度バリデーション', () => {
  describe('validateFrequency', () => {
    it('dailyは有効', () => {
      expect(MedicationEntity.validateFrequency('daily')).toBe(true);
    });

    it('twice_dailyは有効', () => {
      expect(MedicationEntity.validateFrequency('twice_daily')).toBe(true);
    });

    it('three_times_dailyは有効', () => {
      expect(MedicationEntity.validateFrequency('three_times_daily')).toBe(true);
    });

    it('weeklyは有効', () => {
      expect(MedicationEntity.validateFrequency('weekly')).toBe(true);
    });

    it('as_neededは有効', () => {
      expect(MedicationEntity.validateFrequency('as_needed')).toBe(true);
    });

    it('未知の頻度は無効', () => {
      expect(MedicationEntity.validateFrequency('hourly')).toBe(false);
    });

    it('空文字は無効', () => {
      expect(MedicationEntity.validateFrequency('')).toBe(false);
    });
  });

  describe('getAllFrequencies', () => {
    it('全頻度を返す', () => {
      const freqs = MedicationEntity.getAllFrequencies();
      expect(freqs.length).toBe(5);
    });

    it('各頻度にidとlabelがある', () => {
      const freqs = MedicationEntity.getAllFrequencies();
      for (const f of freqs) {
        expect(f.id).toBeTruthy();
        expect(f.label).toBeTruthy();
      }
    });

    it('dailyを含む', () => {
      const freqs = MedicationEntity.getAllFrequencies();
      expect(freqs.some((f) => f.id === 'daily')).toBe(true);
    });

    it('dailyのラベルは毎日', () => {
      const freqs = MedicationEntity.getAllFrequencies();
      const daily = freqs.find((f) => f.id === 'daily');
      expect(daily?.label).toBe('毎日');
    });
  });

  describe('getFrequencySummary', () => {
    it('頻度と用量の両方ある場合はまとめて返す', () => {
      const result = MedicationEntity.getFrequencySummary('daily', '1錠');
      expect(result).toContain('毎日');
      expect(result).toContain('1錠');
    });

    it('頻度のみの場合は頻度のみ返す', () => {
      const result = MedicationEntity.getFrequencySummary('weekly', undefined);
      expect(result).toBe('週1回');
    });

    it('用量のみの場合は用量のみ返す', () => {
      const result = MedicationEntity.getFrequencySummary(undefined, '2錠');
      expect(result).toBe('2錠');
    });

    it('両方undefinedの場合は空文字を返す', () => {
      expect(MedicationEntity.getFrequencySummary(undefined, undefined)).toBe('');
    });
  });
});
