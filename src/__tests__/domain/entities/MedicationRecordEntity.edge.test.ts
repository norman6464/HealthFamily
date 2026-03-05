import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord, DailyRecordGroup } from '@/domain/entities/MedicationRecord';

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

describe('MedicationRecordEntity エッジケーステスト', () => {
  describe('groupByDate', () => {
    it('空配列は空配列を返す', () => {
      expect(MedicationRecordEntity.groupByDate([])).toEqual([]);
    });

    it('新しい日付が先に来る(降順)', () => {
      const records = [
        createRecord({ id: 'r1', takenAt: new Date('2026-03-03T08:00:00') }),
        createRecord({ id: 'r2', takenAt: new Date('2026-03-05T08:00:00') }),
        createRecord({ id: 'r3', takenAt: new Date('2026-03-04T08:00:00') }),
      ];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups[0].date).toBe('2026-03-05');
      expect(groups[1].date).toBe('2026-03-04');
      expect(groups[2].date).toBe('2026-03-03');
    });

    it('同じ日の記録は同じグループに入る', () => {
      const records = [
        createRecord({ id: 'r1', takenAt: new Date('2026-03-05T08:00:00') }),
        createRecord({ id: 'r2', takenAt: new Date('2026-03-05T12:00:00') }),
        createRecord({ id: 'r3', takenAt: new Date('2026-03-05T18:00:00') }),
      ];
      const groups = MedicationRecordEntity.groupByDate(records);
      expect(groups).toHaveLength(1);
      expect(groups[0].records).toHaveLength(3);
    });
  });

  describe('formatDate', () => {
    it('月初の日付を正しくフォーマットする', () => {
      expect(MedicationRecordEntity.formatDate('2026-03-01')).toMatch(/3月1日/);
    });

    it('月末の日付を正しくフォーマットする', () => {
      expect(MedicationRecordEntity.formatDate('2026-03-31')).toMatch(/3月31日/);
    });
  });

  describe('formatTime', () => {
    it('0時0分は00:00を返す', () => {
      const date = new Date('2026-03-05T00:00:00');
      expect(MedicationRecordEntity.formatTime(date)).toBe('00:00');
    });

    it('23時59分は23:59を返す', () => {
      const date = new Date('2026-03-05T23:59:00');
      expect(MedicationRecordEntity.formatTime(date)).toBe('23:59');
    });

    it('9時5分は09:05を返す(ゼロパディング)', () => {
      const date = new Date('2026-03-05T09:05:00');
      expect(MedicationRecordEntity.formatTime(date)).toBe('09:05');
    });
  });

  describe('filterByMember', () => {
    it('memberIdがnullなら全件返す', () => {
      const records = [createRecord(), createRecord({ memberId: 'member-2' })];
      expect(MedicationRecordEntity.filterByMember(records, null)).toHaveLength(2);
    });

    it('指定メンバーの記録のみを返す', () => {
      const records = [
        createRecord({ memberId: 'member-1' }),
        createRecord({ memberId: 'member-2' }),
        createRecord({ memberId: 'member-1' }),
      ];
      expect(MedicationRecordEntity.filterByMember(records, 'member-1')).toHaveLength(2);
    });

    it('該当メンバーがいなければ空配列を返す', () => {
      const records = [createRecord({ memberId: 'member-1' })];
      expect(MedicationRecordEntity.filterByMember(records, 'member-999')).toHaveLength(0);
    });
  });

  describe('filterGroupsByMember', () => {
    const groups: DailyRecordGroup[] = [
      {
        date: '2026-03-05',
        records: [
          createRecord({ memberId: 'member-1' }),
          createRecord({ memberId: 'member-2' }),
        ],
      },
      {
        date: '2026-03-04',
        records: [createRecord({ memberId: 'member-2' })],
      },
    ];

    it('memberIdがnullなら全グループを返す', () => {
      expect(MedicationRecordEntity.filterGroupsByMember(groups, null)).toHaveLength(2);
    });

    it('フィルタ後に空になったグループは除外される', () => {
      const result = MedicationRecordEntity.filterGroupsByMember(groups, 'member-1');
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2026-03-05');
      expect(result[0].records).toHaveLength(1);
    });

    it('該当メンバーがいなければ空配列を返す', () => {
      expect(MedicationRecordEntity.filterGroupsByMember(groups, 'member-999')).toHaveLength(0);
    });
  });
});
