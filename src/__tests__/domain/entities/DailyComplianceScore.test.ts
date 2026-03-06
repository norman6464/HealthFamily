import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Daily Compliance Score', () => {
  describe('getDailyComplianceScore', () => {
    it('全て服用で100点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(5, 5)).toBe(100);
    });

    it('半分服用で50点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(2, 4)).toBe(50);
    });

    it('予定0件は100点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(0, 0)).toBe(100);
    });

    it('1件も服用していなければ0点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(0, 3)).toBe(0);
    });

    it('服用数が予定を超えても100点', () => {
      expect(MedicationRecordEntity.getDailyComplianceScore(6, 5)).toBe(100);
    });
  });

  describe('getComplianceScoreLabel', () => {
    it('100点は完璧', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(100)).toBe('完璧');
    });

    it('90点は優秀', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(90)).toBe('優秀');
    });

    it('70点は良好', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(70)).toBe('良好');
    });

    it('50点は要改善', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(50)).toBe('要改善');
    });

    it('30点は不十分', () => {
      expect(MedicationRecordEntity.getComplianceScoreLabel(30)).toBe('不十分');
    });
  });
});
