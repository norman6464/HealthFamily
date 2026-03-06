import { MemberSummaryEntity, MemberSummary } from '@/domain/entities/MemberSummary';

const createSummary = (overrides: Partial<MemberSummary> = {}): MemberSummary => ({
  memberId: 'm1',
  memberName: 'テスト',
  memberType: 'human',
  medicationCount: 0,
  nextAppointmentDate: null,
  ...overrides,
});

describe('MemberSummaryEntity - Comparison Edge Cases', () => {
  describe('rankByMedicationCount 境界値', () => {
    it('全員薬0件の場合は元の順序を維持', () => {
      const members = [
        createSummary({ memberId: 'a' }),
        createSummary({ memberId: 'b' }),
      ];
      const ranked = MemberSummaryEntity.rankByMedicationCount(members);
      expect(ranked.map(m => m.memberId)).toEqual(['a', 'b']);
    });

    it('1人だけの配列', () => {
      const members = [createSummary({ memberId: 'a', medicationCount: 5 })];
      const ranked = MemberSummaryEntity.rankByMedicationCount(members);
      expect(ranked).toHaveLength(1);
    });

    it('大量メンバーでも正しくソート', () => {
      const members = Array.from({ length: 100 }, (_, i) =>
        createSummary({ memberId: `m${i}`, medicationCount: i })
      );
      const ranked = MemberSummaryEntity.rankByMedicationCount(members);
      expect(ranked[0].medicationCount).toBe(99);
      expect(ranked[99].medicationCount).toBe(0);
    });
  });

  describe('filterByType 境界値', () => {
    it('空配列に対するフィルタ', () => {
      expect(MemberSummaryEntity.filterByType([], 'human')).toEqual([]);
    });

    it('全員同じ種別', () => {
      const members = [
        createSummary({ memberId: 'a', memberType: 'pet' }),
        createSummary({ memberId: 'b', memberType: 'pet' }),
      ];
      const result = MemberSummaryEntity.filterByType(members, 'pet');
      expect(result).toHaveLength(2);
    });
  });

  describe('getGroupActivitySummary 境界値', () => {
    it('全員薬なし・予約なし', () => {
      const members = [
        createSummary(),
        createSummary(),
      ];
      const summary = MemberSummaryEntity.getGroupActivitySummary(members);
      expect(summary.withMedications).toBe(0);
      expect(summary.withAppointments).toBe(0);
      expect(summary.totalMedications).toBe(0);
    });

    it('大量の薬登録', () => {
      const members = [
        createSummary({ medicationCount: 999 }),
      ];
      const summary = MemberSummaryEntity.getGroupActivitySummary(members);
      expect(summary.totalMedications).toBe(999);
    });
  });
});
