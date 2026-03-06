import { MemberSummaryEntity, MemberSummary } from '@/domain/entities/MemberSummary';

const createSummary = (overrides: Partial<MemberSummary> = {}): MemberSummary => ({
  memberId: 'm1',
  memberName: 'テスト太郎',
  memberType: 'human',
  medicationCount: 3,
  nextAppointmentDate: '2025-06-20',
  ...overrides,
});

describe('MemberSummaryEntity - Comparison', () => {
  describe('rankByMedicationCount', () => {
    it('薬の登録数で降順ソートする', () => {
      const members = [
        createSummary({ memberId: 'a', medicationCount: 1 }),
        createSummary({ memberId: 'b', medicationCount: 5 }),
        createSummary({ memberId: 'c', medicationCount: 3 }),
      ];
      const ranked = MemberSummaryEntity.rankByMedicationCount(members);
      expect(ranked.map(m => m.memberId)).toEqual(['b', 'c', 'a']);
    });

    it('空配列は空配列を返す', () => {
      expect(MemberSummaryEntity.rankByMedicationCount([])).toEqual([]);
    });

    it('同数の場合は元の順序を維持する', () => {
      const members = [
        createSummary({ memberId: 'a', medicationCount: 3 }),
        createSummary({ memberId: 'b', medicationCount: 3 }),
      ];
      const ranked = MemberSummaryEntity.rankByMedicationCount(members);
      expect(ranked.map(m => m.memberId)).toEqual(['a', 'b']);
    });
  });

  describe('filterByType', () => {
    const members = [
      createSummary({ memberId: 'h1', memberType: 'human' }),
      createSummary({ memberId: 'p1', memberType: 'pet' }),
      createSummary({ memberId: 'h2', memberType: 'human' }),
    ];

    it('humanでフィルタする', () => {
      const result = MemberSummaryEntity.filterByType(members, 'human');
      expect(result).toHaveLength(2);
      expect(result.every(m => m.memberType === 'human')).toBe(true);
    });

    it('petでフィルタする', () => {
      const result = MemberSummaryEntity.filterByType(members, 'pet');
      expect(result).toHaveLength(1);
      expect(result[0].memberId).toBe('p1');
    });

    it('該当なしの種別は空配列を返す', () => {
      expect(MemberSummaryEntity.filterByType(members, 'robot')).toEqual([]);
    });
  });

  describe('getGroupActivitySummary', () => {
    it('全メンバーのアクティビティ集計を返す', () => {
      const members = [
        createSummary({ medicationCount: 3, nextAppointmentDate: '2025-06-20' }),
        createSummary({ medicationCount: 0, nextAppointmentDate: null }),
        createSummary({ medicationCount: 2, nextAppointmentDate: null }),
      ];
      const summary = MemberSummaryEntity.getGroupActivitySummary(members);
      expect(summary).toEqual({
        totalMembers: 3,
        withMedications: 2,
        withAppointments: 1,
        totalMedications: 5,
      });
    });

    it('空配列は全て0を返す', () => {
      const summary = MemberSummaryEntity.getGroupActivitySummary([]);
      expect(summary).toEqual({
        totalMembers: 0,
        withMedications: 0,
        withAppointments: 0,
        totalMedications: 0,
      });
    });

    it('全員アクティブな場合', () => {
      const members = [
        createSummary({ medicationCount: 2, nextAppointmentDate: '2025-06-20' }),
        createSummary({ medicationCount: 1, nextAppointmentDate: '2025-07-01' }),
      ];
      const summary = MemberSummaryEntity.getGroupActivitySummary(members);
      expect(summary).toEqual({
        totalMembers: 2,
        withMedications: 2,
        withAppointments: 2,
        totalMedications: 3,
      });
    });
  });
});
