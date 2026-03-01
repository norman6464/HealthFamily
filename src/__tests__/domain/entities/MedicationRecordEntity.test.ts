import { describe, it, expect } from 'vitest';
import {
  MedicationRecord,
  MedicationRecordEntity,
} from '@/domain/entities/MedicationRecord';

const createRecord = (overrides: Partial<MedicationRecord> = {}): MedicationRecord => ({
  id: 'record-1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  medicationId: 'med-1',
  medicationName: 'テスト薬A',
  userId: 'user-1',
  takenAt: new Date('2024-06-15T08:30:00'),
  ...overrides,
});

describe('MedicationRecordEntity', () => {
  describe('groupByDate', () => {
    it('日付ごとにグループ化する', () => {
      const records: MedicationRecord[] = [
        createRecord({ id: 'r1', takenAt: new Date('2024-06-15T08:00:00') }),
        createRecord({ id: 'r2', takenAt: new Date('2024-06-15T12:00:00') }),
        createRecord({ id: 'r3', takenAt: new Date('2024-06-14T09:00:00') }),
      ];

      const groups = MedicationRecordEntity.groupByDate(records);

      expect(groups).toHaveLength(2);
      expect(groups[0].date).toBe('2024-06-15');
      expect(groups[0].records).toHaveLength(2);
      expect(groups[1].date).toBe('2024-06-14');
      expect(groups[1].records).toHaveLength(1);
    });

    it('新しい日付が先に来る', () => {
      const records: MedicationRecord[] = [
        createRecord({ id: 'r1', takenAt: new Date('2024-06-10T08:00:00') }),
        createRecord({ id: 'r2', takenAt: new Date('2024-06-15T08:00:00') }),
        createRecord({ id: 'r3', takenAt: new Date('2024-06-12T08:00:00') }),
      ];

      const groups = MedicationRecordEntity.groupByDate(records);

      expect(groups[0].date).toBe('2024-06-15');
      expect(groups[1].date).toBe('2024-06-12');
      expect(groups[2].date).toBe('2024-06-10');
    });

    it('空の配列の場合は空を返す', () => {
      const groups = MedicationRecordEntity.groupByDate([]);
      expect(groups).toHaveLength(0);
    });
  });

  describe('formatDate', () => {
    it('日本語形式で日付をフォーマットする', () => {
      const result = MedicationRecordEntity.formatDate('2024-06-15');
      expect(result).toBe('6月15日(土)');
    });

    it('曜日が正しく表示される', () => {
      expect(MedicationRecordEntity.formatDate('2024-06-10')).toContain('月');
      expect(MedicationRecordEntity.formatDate('2024-06-11')).toContain('火');
      expect(MedicationRecordEntity.formatDate('2024-06-12')).toContain('水');
      expect(MedicationRecordEntity.formatDate('2024-06-13')).toContain('木');
      expect(MedicationRecordEntity.formatDate('2024-06-14')).toContain('金');
      expect(MedicationRecordEntity.formatDate('2024-06-15')).toContain('土');
      expect(MedicationRecordEntity.formatDate('2024-06-16')).toContain('日');
    });
  });

  describe('formatTime', () => {
    it('時刻を HH:mm 形式で返す', () => {
      const result = MedicationRecordEntity.formatTime(new Date('2024-06-15T08:30:00'));
      expect(result).toBe('08:30');
    });

    it('午後の時刻も正しく表示する', () => {
      const result = MedicationRecordEntity.formatTime(new Date('2024-06-15T14:05:00'));
      expect(result).toBe('14:05');
    });

    it('深夜0時を 00:00 で返す', () => {
      const result = MedicationRecordEntity.formatTime(new Date('2024-06-15T00:00:00'));
      expect(result).toBe('00:00');
    });
  });

  describe('groupByDate (エッジケース)', () => {
    it('1件のみの場合もグループ化できる', () => {
      const records = [createRecord({ id: 'r1' })];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups).toHaveLength(1);
      expect(groups[0].records).toHaveLength(1);
    });
  });
});
