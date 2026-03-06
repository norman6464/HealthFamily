import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Member Adherence Edge Cases', () => {
  describe('getMedicationAdherenceByMember', () => {
    it('全て完了は100', () => {
      const records = [
        { memberId: 'a', completed: true },
        { memberId: 'a', completed: true },
      ];
      expect(MedicationRecordEntity.getMedicationAdherenceByMember(records)['a']).toBe(100);
    });

    it('全て未完了は0', () => {
      const records = [
        { memberId: 'a', completed: false },
        { memberId: 'a', completed: false },
      ];
      expect(MedicationRecordEntity.getMedicationAdherenceByMember(records)['a']).toBe(0);
    });

    it('多数メンバー', () => {
      const records = Array.from({ length: 10 }, (_, i) => ({
        memberId: `m${i}`,
        completed: i % 2 === 0,
      }));
      const result = MedicationRecordEntity.getMedicationAdherenceByMember(records);
      expect(Object.keys(result)).toHaveLength(10);
    });
  });

  describe('getMemberAdherenceLabel', () => {
    it('境界値90は優秀', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(90)).toBe('優秀');
    });

    it('境界値89は良好', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(89)).toBe('良好');
    });

    it('境界値70は良好', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(70)).toBe('良好');
    });

    it('境界値69は要注意', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(69)).toBe('要注意');
    });

    it('境界値50は要注意', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(50)).toBe('要注意');
    });

    it('境界値49は要改善', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(49)).toBe('要改善');
    });
  });
});
