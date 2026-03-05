import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord, DailyRecordGroup } from '@/domain/entities/MedicationRecord';

const createRecord = (overrides: Partial<MedicationRecord> = {}): MedicationRecord => ({
  id: 'r1',
  memberId: 'member-1',
  memberName: 'テスト太郎',
  medicationId: 'med-1',
  medicationName: 'テスト薬A',
  userId: 'user-1',
  takenAt: new Date('2026-03-05T10:00:00'),
  ...overrides,
});

describe('MedicationRecordEntity - filterByMember', () => {
  it('メンバーIDでレコードをフィルタリングする', () => {
    const records = [
      createRecord({ id: 'r1', memberId: 'member-1' }),
      createRecord({ id: 'r2', memberId: 'member-2', memberName: 'テスト花子' }),
      createRecord({ id: 'r3', memberId: 'member-1' }),
    ];
    const filtered = MedicationRecordEntity.filterByMember(records, 'member-1');
    expect(filtered).toHaveLength(2);
    expect(filtered.every((r) => r.memberId === 'member-1')).toBe(true);
  });

  it('nullの場合は全レコードを返す', () => {
    const records = [
      createRecord({ id: 'r1', memberId: 'member-1' }),
      createRecord({ id: 'r2', memberId: 'member-2' }),
    ];
    const filtered = MedicationRecordEntity.filterByMember(records, null);
    expect(filtered).toHaveLength(2);
  });

  it('該当するメンバーがいない場合は空配列を返す', () => {
    const records = [
      createRecord({ id: 'r1', memberId: 'member-1' }),
    ];
    const filtered = MedicationRecordEntity.filterByMember(records, 'member-999');
    expect(filtered).toHaveLength(0);
  });

  it('空配列の場合は空配列を返す', () => {
    const filtered = MedicationRecordEntity.filterByMember([], 'member-1');
    expect(filtered).toHaveLength(0);
  });
});

describe('MedicationRecordEntity - filterGroupsByMember', () => {
  it('グループ内のレコードをメンバーIDでフィルタリングする', () => {
    const groups: DailyRecordGroup[] = [
      {
        date: '2026-03-05',
        records: [
          createRecord({ id: 'r1', memberId: 'member-1' }),
          createRecord({ id: 'r2', memberId: 'member-2', memberName: 'テスト花子' }),
        ],
      },
      {
        date: '2026-03-04',
        records: [
          createRecord({ id: 'r3', memberId: 'member-2', memberName: 'テスト花子', takenAt: new Date('2026-03-04T10:00:00') }),
        ],
      },
    ];

    const filtered = MedicationRecordEntity.filterGroupsByMember(groups, 'member-1');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].date).toBe('2026-03-05');
    expect(filtered[0].records).toHaveLength(1);
  });

  it('nullの場合は全グループを返す', () => {
    const groups: DailyRecordGroup[] = [
      {
        date: '2026-03-05',
        records: [createRecord({ id: 'r1' }), createRecord({ id: 'r2' })],
      },
    ];
    const filtered = MedicationRecordEntity.filterGroupsByMember(groups, null);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].records).toHaveLength(2);
  });

  it('フィルタ後に空になったグループは除外する', () => {
    const groups: DailyRecordGroup[] = [
      {
        date: '2026-03-05',
        records: [
          createRecord({ id: 'r1', memberId: 'member-2', memberName: 'テスト花子' }),
        ],
      },
    ];
    const filtered = MedicationRecordEntity.filterGroupsByMember(groups, 'member-1');
    expect(filtered).toHaveLength(0);
  });
});
