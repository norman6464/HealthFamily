import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (overrides: Partial<MedicationRecord> & { takenAt: Date }): MedicationRecord => ({
  id: `rec-${overrides.takenAt.toISOString()}`,
  memberId: 'member-1',
  memberName: '太郎',
  medicationId: 'med-1',
  medicationName: '薬A',
  userId: 'user-1',
  ...overrides,
});

describe('MedicationRecordEntity 服薬パターン分析', () => {
  describe('getRecordsByDayOfWeek', () => {
    it('空配列は全曜日0を返す', () => {
      const result = MedicationRecordEntity.getRecordsByDayOfWeek([]);
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it('月曜の記録1件', () => {
      const records = [createRecord({ takenAt: new Date('2026-03-02T08:00:00') })]; // 月
      const result = MedicationRecordEntity.getRecordsByDayOfWeek(records);
      expect(result[1]).toBe(1);
    });

    it('複数曜日の記録を集計する', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-02T08:00:00') }), // 月
        createRecord({ takenAt: new Date('2026-03-02T12:00:00') }), // 月
        createRecord({ takenAt: new Date('2026-03-04T08:00:00') }), // 水
      ];
      const result = MedicationRecordEntity.getRecordsByDayOfWeek(records);
      expect(result[1]).toBe(2);
      expect(result[3]).toBe(1);
    });
  });

  describe('getMostRecordedMedication', () => {
    it('空配列はnullを返す', () => {
      expect(MedicationRecordEntity.getMostRecordedMedication([])).toBeNull();
    });

    it('最も記録が多い薬名を返す', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-01'), medicationName: '薬A' }),
        createRecord({ takenAt: new Date('2026-03-02'), medicationName: '薬B' }),
        createRecord({ takenAt: new Date('2026-03-03'), medicationName: '薬A' }),
      ];
      const result = MedicationRecordEntity.getMostRecordedMedication(records);
      expect(result!.medicationName).toBe('薬A');
      expect(result!.count).toBe(2);
    });

    it('同数の場合は最初に出現した薬を返す', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-01'), medicationName: '薬A' }),
        createRecord({ takenAt: new Date('2026-03-02'), medicationName: '薬B' }),
      ];
      const result = MedicationRecordEntity.getMostRecordedMedication(records);
      expect(result!.count).toBe(1);
    });
  });

  describe('getRecordGaps', () => {
    it('空配列は空配列を返す', () => {
      expect(MedicationRecordEntity.getRecordGaps([])).toEqual([]);
    });

    it('1件のみは空配列を返す', () => {
      const records = [createRecord({ takenAt: new Date('2026-03-05') })];
      expect(MedicationRecordEntity.getRecordGaps(records)).toEqual([]);
    });

    it('閾値以上の空白期間を検出する', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-10') }),
        createRecord({ takenAt: new Date('2026-03-05') }),
        createRecord({ takenAt: new Date('2026-03-01') }),
      ];
      // 空白: 5日(3/1→3/5)、5日(3/5→3/10)、閾値3日以上
      const result = MedicationRecordEntity.getRecordGaps(records, 3);
      expect(result).toHaveLength(2);
    });

    it('連続記録は空白として検出しない', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-03') }),
        createRecord({ takenAt: new Date('2026-03-02') }),
        createRecord({ takenAt: new Date('2026-03-01') }),
      ];
      const result = MedicationRecordEntity.getRecordGaps(records, 3);
      expect(result).toEqual([]);
    });

    it('デフォルト閾値は3日', () => {
      const records = [
        createRecord({ takenAt: new Date('2026-03-06') }),
        createRecord({ takenAt: new Date('2026-03-01') }),
      ];
      // 5日の空白、デフォルト閾値3以上
      const result = MedicationRecordEntity.getRecordGaps(records);
      expect(result).toHaveLength(1);
      expect(result[0].days).toBe(5);
    });
  });
});
