import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Compliance Edge Cases', () => {
  describe('getHourlyDistribution', () => {
    it('深夜0時の記録', () => {
      const records = [{ takenAt: new Date('2026-03-01T00:00:00') }];
      const result = MedicationRecordEntity.getHourlyDistribution(records);
      expect(result[0]).toBe(1);
    });

    it('23時59分の記録', () => {
      const records = [{ takenAt: new Date('2026-03-01T23:59:00') }];
      const result = MedicationRecordEntity.getHourlyDistribution(records);
      expect(result[23]).toBe(1);
    });

    it('全時間帯に1件ずつ', () => {
      const records = Array.from({ length: 24 }, (_, i) => ({
        takenAt: new Date(`2026-03-01T${String(i).padStart(2, '0')}:00:00`),
      }));
      const result = MedicationRecordEntity.getHourlyDistribution(records);
      expect(result.every((v) => v === 1)).toBe(true);
    });
  });

  describe('getComplianceLevel', () => {
    it('境界値90でexcellent', () => {
      expect(MedicationRecordEntity.getComplianceLevel(90)).toBe('excellent');
    });

    it('境界値89でgood', () => {
      expect(MedicationRecordEntity.getComplianceLevel(89)).toBe('good');
    });

    it('境界値70でgood', () => {
      expect(MedicationRecordEntity.getComplianceLevel(70)).toBe('good');
    });

    it('境界値69でfair', () => {
      expect(MedicationRecordEntity.getComplianceLevel(69)).toBe('fair');
    });

    it('境界値50でfair', () => {
      expect(MedicationRecordEntity.getComplianceLevel(50)).toBe('fair');
    });

    it('境界値49でpoor', () => {
      expect(MedicationRecordEntity.getComplianceLevel(49)).toBe('poor');
    });
  });

  describe('getConsecutiveMissedDays', () => {
    it('todayと同日の記録で0を返す', () => {
      expect(MedicationRecordEntity.getConsecutiveMissedDays(['2026-03-05'], '2026-03-05')).toBe(0);
    });

    it('未来日付の記録で0を返す', () => {
      expect(MedicationRecordEntity.getConsecutiveMissedDays(['2026-03-06'], '2026-03-05')).toBe(0);
    });
  });
});
