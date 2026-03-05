import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - フォーマット', () => {
  describe('formatDate', () => {
    it('平日の日付を正しくフォーマットする', () => {
      expect(MedicationRecordEntity.formatDate('2026-03-05')).toBe('3月5日(木)');
    });

    it('月初を正しくフォーマットする', () => {
      expect(MedicationRecordEntity.formatDate('2026-01-01')).toBe('1月1日(木)');
    });

    it('月末を正しくフォーマットする', () => {
      expect(MedicationRecordEntity.formatDate('2026-12-31')).toBe('12月31日(木)');
    });

    it('日曜日を正しく表示する', () => {
      expect(MedicationRecordEntity.formatDate('2026-03-01')).toBe('3月1日(日)');
    });

    it('土曜日を正しく表示する', () => {
      expect(MedicationRecordEntity.formatDate('2026-03-07')).toBe('3月7日(土)');
    });
  });

  describe('formatTime', () => {
    it('午前の時刻をフォーマットする', () => {
      expect(MedicationRecordEntity.formatTime(new Date('2026-03-05T08:30:00'))).toBe('08:30');
    });

    it('午後の時刻をフォーマットする', () => {
      expect(MedicationRecordEntity.formatTime(new Date('2026-03-05T15:45:00'))).toBe('15:45');
    });

    it('深夜0時をフォーマットする', () => {
      expect(MedicationRecordEntity.formatTime(new Date('2026-03-05T00:00:00'))).toBe('00:00');
    });

    it('23:59をフォーマットする', () => {
      expect(MedicationRecordEntity.formatTime(new Date('2026-03-05T23:59:00'))).toBe('23:59');
    });
  });

  describe('groupByDate', () => {
    const createRecord = (id: string, takenAt: string): MedicationRecord => ({
      id,
      memberId: 'member-1',
      memberName: 'テスト太郎',
      medicationId: 'med-1',
      medicationName: 'テスト薬',
      userId: 'user-1',
      takenAt: new Date(takenAt),
    });

    it('同じ日の記録を1グループにまとめる', () => {
      const records = [
        createRecord('r1', '2026-03-05T08:00:00'),
        createRecord('r2', '2026-03-05T20:00:00'),
      ];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups).toHaveLength(1);
      expect(groups[0].records).toHaveLength(2);
    });

    it('新しい日付が先に来る', () => {
      const records = [
        createRecord('r1', '2026-03-03T10:00:00'),
        createRecord('r2', '2026-03-05T10:00:00'),
        createRecord('r3', '2026-03-04T10:00:00'),
      ];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups[0].date).toBe('2026-03-05');
      expect(groups[1].date).toBe('2026-03-04');
      expect(groups[2].date).toBe('2026-03-03');
    });

    it('空配列は空配列を返す', () => {
      expect(MedicationRecordEntity.groupByDate([])).toEqual([]);
    });

    it('年をまたぐ記録を正しくグループ化する', () => {
      const records = [
        createRecord('r1', '2026-01-01T00:00:00'),
        createRecord('r2', '2025-12-31T23:59:00'),
      ];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups).toHaveLength(2);
      expect(groups[0].date).toBe('2026-01-01');
      expect(groups[1].date).toBe('2025-12-31');
    });
  });
});
