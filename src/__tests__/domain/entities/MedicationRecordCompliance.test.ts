import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Compliance Pattern', () => {
  describe('getHourlyDistribution', () => {
    it('時間帯別の服薬回数を返す', () => {
      const records = [
        { takenAt: new Date('2026-03-01T08:00:00') },
        { takenAt: new Date('2026-03-01T08:30:00') },
        { takenAt: new Date('2026-03-02T12:00:00') },
        { takenAt: new Date('2026-03-02T20:00:00') },
      ];
      const result = MedicationRecordEntity.getHourlyDistribution(records);
      expect(result[8]).toBe(2);
      expect(result[12]).toBe(1);
      expect(result[20]).toBe(1);
      expect(result[0]).toBe(0);
    });

    it('空配列で全て0を返す', () => {
      const result = MedicationRecordEntity.getHourlyDistribution([]);
      expect(result.length).toBe(24);
      expect(result.every((v) => v === 0)).toBe(true);
    });
  });

  describe('getConsecutiveMissedDays', () => {
    it('毎日記録ありで0を返す', () => {
      const dates = ['2026-03-01', '2026-03-02', '2026-03-03'];
      expect(MedicationRecordEntity.getConsecutiveMissedDays(dates, '2026-03-03')).toBe(0);
    });

    it('1日空きで1を返す', () => {
      const dates = ['2026-03-01', '2026-03-03'];
      expect(MedicationRecordEntity.getConsecutiveMissedDays(dates, '2026-03-03')).toBe(0);
    });

    it('最終記録から2日経過で2を返す', () => {
      const dates = ['2026-03-01'];
      expect(MedicationRecordEntity.getConsecutiveMissedDays(dates, '2026-03-03')).toBe(2);
    });

    it('記録なしでtoday基準の日数を返す', () => {
      expect(MedicationRecordEntity.getConsecutiveMissedDays([], '2026-03-05')).toBe(-1);
    });
  });

  describe('getComplianceLevel', () => {
    it('90%以上でexcellentを返す', () => {
      expect(MedicationRecordEntity.getComplianceLevel(95)).toBe('excellent');
    });

    it('70-89%でgoodを返す', () => {
      expect(MedicationRecordEntity.getComplianceLevel(75)).toBe('good');
    });

    it('50-69%でfairを返す', () => {
      expect(MedicationRecordEntity.getComplianceLevel(55)).toBe('fair');
    });

    it('50%未満でpoorを返す', () => {
      expect(MedicationRecordEntity.getComplianceLevel(30)).toBe('poor');
    });

    it('100%でexcellentを返す', () => {
      expect(MedicationRecordEntity.getComplianceLevel(100)).toBe('excellent');
    });

    it('0%でpoorを返す', () => {
      expect(MedicationRecordEntity.getComplianceLevel(0)).toBe('poor');
    });

    it('レベルに応じたラベルを返す', () => {
      expect(MedicationRecordEntity.getComplianceLevelLabel('excellent')).toBe('優秀');
      expect(MedicationRecordEntity.getComplianceLevelLabel('good')).toBe('良好');
      expect(MedicationRecordEntity.getComplianceLevelLabel('fair')).toBe('普通');
      expect(MedicationRecordEntity.getComplianceLevelLabel('poor')).toBe('要改善');
    });
  });
});
