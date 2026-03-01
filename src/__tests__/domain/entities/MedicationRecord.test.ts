import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (overrides: Partial<MedicationRecord> = {}): MedicationRecord => ({
  id: 'r1',
  memberId: 'm1',
  memberName: '太郎',
  medicationId: 'med1',
  medicationName: '頭痛薬',
  userId: 'u1',
  takenAt: new Date('2025-06-15T08:30:00'),
  ...overrides,
});

describe('MedicationRecordEntity', () => {
  describe('groupByDate', () => {
    it('記録を日付ごとにグループ化する', () => {
      const records = [
        createRecord({ id: 'r1', takenAt: new Date('2025-06-15T08:00:00') }),
        createRecord({ id: 'r2', takenAt: new Date('2025-06-15T12:00:00') }),
        createRecord({ id: 'r3', takenAt: new Date('2025-06-14T09:00:00') }),
      ];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups).toHaveLength(2);
      expect(groups[0].date).toBe('2025-06-15');
      expect(groups[0].records).toHaveLength(2);
      expect(groups[1].date).toBe('2025-06-14');
      expect(groups[1].records).toHaveLength(1);
    });

    it('新しい日付が先に来る', () => {
      const records = [
        createRecord({ id: 'r1', takenAt: new Date('2025-06-10T08:00:00') }),
        createRecord({ id: 'r2', takenAt: new Date('2025-06-20T08:00:00') }),
      ];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups[0].date).toBe('2025-06-20');
      expect(groups[1].date).toBe('2025-06-10');
    });

    it('空の配列の場合は空を返す', () => {
      const groups = MedicationRecordEntity.groupByDate([]);
      expect(groups).toHaveLength(0);
    });
  });

  describe('formatDate', () => {
    it('日本語形式でフォーマットする', () => {
      const result = MedicationRecordEntity.formatDate('2025-06-15');
      expect(result).toContain('6月15日');
    });
  });

  describe('formatTime', () => {
    it('HH:mm形式でフォーマットする', () => {
      const result = MedicationRecordEntity.formatTime(new Date('2025-06-15T08:30:00'));
      expect(result).toBe('08:30');
    });

    it('0埋めが正しく動作する', () => {
      const result = MedicationRecordEntity.formatTime(new Date('2025-06-15T01:05:00'));
      expect(result).toBe('01:05');
    });
  });
});
