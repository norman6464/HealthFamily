import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord, DailyRecordGroup } from '@/domain/entities/MedicationRecord';

const makeRecord = (overrides: Partial<MedicationRecord>): MedicationRecord => ({
  id: 'rec-1',
  memberId: 'member-1',
  memberName: 'Test',
  medicationId: 'med-1',
  medicationName: 'Test Med',
  userId: 'user-1',
  takenAt: new Date('2026-03-05T08:00:00'),
  ...overrides,
});

describe('MedicationRecordEntity メモフィルター', () => {
  describe('hasNotes', () => {
    it('メモありの記録はtrueを返す', () => {
      const record = makeRecord({ notes: 'テストメモ' });
      expect(MedicationRecordEntity.hasNotes(record)).toBe(true);
    });

    it('メモなしの記録はfalseを返す', () => {
      const record = makeRecord({});
      expect(MedicationRecordEntity.hasNotes(record)).toBe(false);
    });

    it('空文字のメモはfalseを返す', () => {
      const record = makeRecord({ notes: '' });
      expect(MedicationRecordEntity.hasNotes(record)).toBe(false);
    });

    it('空白のみのメモはfalseを返す', () => {
      const record = makeRecord({ notes: '   ' });
      expect(MedicationRecordEntity.hasNotes(record)).toBe(false);
    });
  });

  describe('filterWithNotes', () => {
    it('メモ付き記録のみを返す', () => {
      const records = [
        makeRecord({ id: '1', notes: 'メモあり' }),
        makeRecord({ id: '2' }),
        makeRecord({ id: '3', notes: '別のメモ' }),
      ];
      const result = MedicationRecordEntity.filterWithNotes(records);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });

    it('メモ付き記録がない場合は空配列を返す', () => {
      const records = [makeRecord({ id: '1' }), makeRecord({ id: '2' })];
      const result = MedicationRecordEntity.filterWithNotes(records);
      expect(result).toHaveLength(0);
    });

    it('空配列の場合は空配列を返す', () => {
      expect(MedicationRecordEntity.filterWithNotes([])).toHaveLength(0);
    });
  });

  describe('filterGroupsWithNotes', () => {
    it('グループ内のメモ付き記録のみを残す', () => {
      const groups: DailyRecordGroup[] = [
        {
          date: '2026-03-05',
          records: [
            makeRecord({ id: '1', notes: 'メモ' }),
            makeRecord({ id: '2' }),
          ],
        },
      ];
      const result = MedicationRecordEntity.filterGroupsWithNotes(groups);
      expect(result).toHaveLength(1);
      expect(result[0].records).toHaveLength(1);
      expect(result[0].records[0].id).toBe('1');
    });

    it('メモ付き記録がないグループは除外する', () => {
      const groups: DailyRecordGroup[] = [
        {
          date: '2026-03-05',
          records: [makeRecord({ id: '1' })],
        },
        {
          date: '2026-03-04',
          records: [makeRecord({ id: '2', notes: 'メモ' })],
        },
      ];
      const result = MedicationRecordEntity.filterGroupsWithNotes(groups);
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-03-04');
    });
  });
});
