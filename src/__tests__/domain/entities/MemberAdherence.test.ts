import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Member Adherence', () => {
  describe('getMedicationAdherenceByMember', () => {
    it('メンバー別の遵守率を算出する', () => {
      const records = [
        { memberId: 'a', completed: true },
        { memberId: 'a', completed: true },
        { memberId: 'a', completed: false },
        { memberId: 'b', completed: true },
        { memberId: 'b', completed: false },
      ];
      const result = MedicationRecordEntity.getMedicationAdherenceByMember(records);
      expect(result['a']).toBeCloseTo(67, 0);
      expect(result['b']).toBe(50);
    });

    it('空配列は空オブジェクト', () => {
      expect(MedicationRecordEntity.getMedicationAdherenceByMember([])).toEqual({});
    });

    it('1メンバーのみ', () => {
      const records = [
        { memberId: 'a', completed: true },
        { memberId: 'a', completed: true },
      ];
      const result = MedicationRecordEntity.getMedicationAdherenceByMember(records);
      expect(result['a']).toBe(100);
    });
  });

  describe('getMemberAdherenceLabel', () => {
    it('90以上は優秀', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(90)).toBe('優秀');
    });

    it('70以上は良好', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(70)).toBe('良好');
    });

    it('50以上は要注意', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(50)).toBe('要注意');
    });

    it('50未満は要改善', () => {
      expect(MedicationRecordEntity.getMemberAdherenceLabel(49)).toBe('要改善');
    });
  });
});
