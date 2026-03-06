import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Compliance Score Edge Cases', () => {
  describe('getDailyComplianceScore', () => {
    it('大量の服用と予定', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(100, 100)).toBe(100);
    });

    it('1/3で33点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(1, 3)).toBe(33);
    });

    it('2/3で67点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(2, 3)).toBe(67);
    });

    it('負の服用数は0点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(-1, 5)).toBe(0);
    });
  });

  describe('getComplianceScoreLabel', () => {
    it('境界値99は優秀', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(99)).toBe('優秀');
    });

    it('境界値89は良好', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(89)).toBe('良好');
    });

    it('境界値69は要改善', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(69)).toBe('要改善');
    });

    it('境界値49は不十分', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(49)).toBe('不十分');
    });

    it('0は不十分', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(0)).toBe('不十分');
    });
  });
});
