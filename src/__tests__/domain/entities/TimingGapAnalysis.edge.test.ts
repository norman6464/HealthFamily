import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Timing Gap Edge Cases', () => {
  describe('getTimingGaps', () => {
    it('深夜の服薬(23:30予定、23:45実績)', () => {
      const records = [
        { scheduledTime: '23:30', takenAt: new Date('2026-03-05T23:45:00') },
      ];
      expect(MedicationRecordEntity.getTimingGaps(records)).toEqual([15]);
    });

    it('早朝の服薬(06:00予定、05:50実績)で負値', () => {
      const records = [
        { scheduledTime: '06:00', takenAt: new Date('2026-03-05T05:50:00') },
      ];
      expect(MedicationRecordEntity.getTimingGaps(records)).toEqual([-10]);
    });

    it('複数レコードの場合', () => {
      const records = [
        { scheduledTime: '08:00', takenAt: new Date('2026-03-05T08:00:00') },
        { scheduledTime: '12:00', takenAt: new Date('2026-03-05T12:30:00') },
        { scheduledTime: '20:00', takenAt: new Date('2026-03-05T19:45:00') },
      ];
      expect(MedicationRecordEntity.getTimingGaps(records)).toEqual([0, 30, -15]);
    });
  });

  describe('getAverageTimingGap', () => {
    it('大きなギャップ', () => {
      expect(MedicationRecordEntity.getAverageTimingGap([120, -60])).toBe(90);
    });

    it('1要素', () => {
      expect(MedicationRecordEntity.getAverageTimingGap([7])).toBe(7);
    });

    it('全て負値', () => {
      expect(MedicationRecordEntity.getAverageTimingGap([-5, -10, -15])).toBe(10);
    });
  });

  describe('getTimingAccuracyLabel', () => {
    it('境界値5で「正確」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(5)).toBe('正確');
    });

    it('境界値6で「ほぼ正確」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(6)).toBe('ほぼ正確');
    });

    it('境界値15で「ほぼ正確」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(15)).toBe('ほぼ正確');
    });

    it('境界値16で「やや遅れ」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(16)).toBe('やや遅れ');
    });

    it('境界値30で「やや遅れ」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(30)).toBe('やや遅れ');
    });

    it('境界値31で「大幅な遅れ」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(31)).toBe('大幅な遅れ');
    });
  });
});
