import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (overrides: Partial<MedicationRecord> = {}): MedicationRecord => ({
  id: 'rec-1',
  memberId: 'member-1',
  memberName: '太郎',
  medicationId: 'med-1',
  medicationName: '薬A',
  userId: 'user-1',
  takenAt: new Date('2026-03-05T08:00:00'),
  ...overrides,
});

describe('MedicationRecordEntity 服薬集計', () => {
  describe('getDailyRecordCounts', () => {
    it('空配列は空マップを返す', () => {
      expect(MedicationRecordEntity.getDailyRecordCounts([])).toEqual({});
    });

    it('同じ日の記録をカウントする', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-05T08:00:00') }),
        createRecord({ takenAt: new Date('2026-03-05T12:00:00') }),
        createRecord({ takenAt: new Date('2026-03-05T18:00:00') }),
      ];
      const counts = MedicationRecordEntity.getDailyRecordCounts(records);
      expect(counts['2026-03-05']).toBe(3);
    });

    it('異なる日の記録を別々にカウントする', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-04T08:00:00') }),
        createRecord({ takenAt: new Date('2026-03-05T08:00:00') }),
        createRecord({ takenAt: new Date('2026-03-05T12:00:00') }),
      ];
      const counts = MedicationRecordEntity.getDailyRecordCounts(records);
      expect(counts['2026-03-04']).toBe(1);
      expect(counts['2026-03-05']).toBe(2);
    });
  });

  describe('getMedicationFrequency', () => {
    it('空配列は空配列を返す', () => {
      expect(MedicationRecordEntity.getMedicationFrequency([])).toEqual([]);
    });

    it('薬別にカウントしてソートする', () => {
      const records = [
        createRecord({ medicationName: '薬B' }),
        createRecord({ medicationName: '薬A' }),
        createRecord({ medicationName: '薬A' }),
        createRecord({ medicationName: '薬A' }),
        createRecord({ medicationName: '薬B' }),
      ];
      const freq = MedicationRecordEntity.getMedicationFrequency(records);
      expect(freq).toEqual([
        { medicationName: '薬A', count: 3 },
        { medicationName: '薬B', count: 2 },
      ]);
    });

    it('同じ回数の薬がある場合も正しく返す', () => {
      const records = [
        createRecord({ medicationName: '薬A' }),
        createRecord({ medicationName: '薬B' }),
      ];
      const freq = MedicationRecordEntity.getMedicationFrequency(records);
      expect(freq).toHaveLength(2);
      expect(freq[0].count).toBe(1);
      expect(freq[1].count).toBe(1);
    });
  });

  describe('getTotalRecordCount', () => {
    it('空配列は0を返す', () => {
      expect(MedicationRecordEntity.getTotalRecordCount([])).toBe(0);
    });

    it('配列の長さを返す', () => {
      const records = [createRecord(), createRecord(), createRecord()];
      expect(MedicationRecordEntity.getTotalRecordCount(records)).toBe(3);
    });
  });
});
