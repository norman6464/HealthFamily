import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (takenAt: Date): MedicationRecord => ({
  id: 'rec-1',
  memberId: 'member-1',
  memberName: '太郎',
  medicationId: 'med-1',
  medicationName: '薬A',
  userId: 'user-1',
  takenAt,
});

describe('MedicationRecordEntity 服薬タイミング分析', () => {
  describe('getAverageTimeTaken', () => {
    it('空配列はnullを返す', () => {
      expect(MedicationRecordEntity.getAverageTimeTaken([])).toBeNull();
    });

    it('単一記録はその時刻を返す', () => {
      const records = [createRecord(new Date('2026-03-05T08:30:00'))];
      const result = MedicationRecordEntity.getAverageTimeTaken(records);
      expect(result).toBe('08:30');
    });

    it('複数記録の平均時刻を返す', () => {
      const records = [
        createRecord(new Date('2026-03-05T08:00:00')),
        createRecord(new Date('2026-03-05T10:00:00')),
      ];
      const result = MedicationRecordEntity.getAverageTimeTaken(records);
      expect(result).toBe('09:00');
    });

    it('分も含めた平均を正しく計算する', () => {
      const records = [
        createRecord(new Date('2026-03-05T08:00:00')),
        createRecord(new Date('2026-03-05T09:00:00')),
        createRecord(new Date('2026-03-05T10:30:00')),
      ];
      const result = MedicationRecordEntity.getAverageTimeTaken(records);
      expect(result).toBe('09:10');
    });
  });

  describe('getTimePeriodDistribution', () => {
    it('空配列は全時間帯0を返す', () => {
      const result = MedicationRecordEntity.getTimePeriodDistribution([]);
      expect(result.morning).toBe(0);
      expect(result.afternoon).toBe(0);
      expect(result.evening).toBe(0);
      expect(result.night).toBe(0);
    });

    it('各時間帯に正しく分類する', () => {
      const records = [
        createRecord(new Date('2026-03-05T07:00:00')), // morning
        createRecord(new Date('2026-03-05T08:00:00')), // morning
        createRecord(new Date('2026-03-05T13:00:00')), // afternoon
        createRecord(new Date('2026-03-05T18:00:00')), // evening
        createRecord(new Date('2026-03-05T22:00:00')), // night
      ];
      const result = MedicationRecordEntity.getTimePeriodDistribution(records);
      expect(result.morning).toBe(2);
      expect(result.afternoon).toBe(1);
      expect(result.evening).toBe(1);
      expect(result.night).toBe(1);
    });

    it('深夜0時はnightに分類する', () => {
      const records = [createRecord(new Date('2026-03-05T00:00:00'))];
      const result = MedicationRecordEntity.getTimePeriodDistribution(records);
      expect(result.night).toBe(1);
    });
  });

  describe('getMostActiveHour', () => {
    it('空配列はnullを返す', () => {
      expect(MedicationRecordEntity.getMostActiveHour([])).toBeNull();
    });

    it('最も多い時間(時)を返す', () => {
      const records = [
        createRecord(new Date('2026-03-05T08:00:00')),
        createRecord(new Date('2026-03-05T08:30:00')),
        createRecord(new Date('2026-03-05T08:45:00')),
        createRecord(new Date('2026-03-05T12:00:00')),
      ];
      expect(MedicationRecordEntity.getMostActiveHour(records)).toBe(8);
    });

    it('同数の場合は最初の時間を返す', () => {
      const records = [
        createRecord(new Date('2026-03-05T08:00:00')),
        createRecord(new Date('2026-03-05T12:00:00')),
      ];
      const result = MedicationRecordEntity.getMostActiveHour(records);
      expect(result).not.toBeNull();
    });

    it('単一記録はその時間を返す', () => {
      const records = [createRecord(new Date('2026-03-05T15:30:00'))];
      expect(MedicationRecordEntity.getMostActiveHour(records)).toBe(15);
    });
  });
});
