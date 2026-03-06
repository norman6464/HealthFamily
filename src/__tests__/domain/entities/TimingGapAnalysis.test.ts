import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Timing Gap Analysis', () => {
  describe('getTimingGaps', () => {
    it('予定と実績の差を分単位で返す', () => {
      const records = [
        { scheduledTime: '08:00', takenAt: new Date('2026-03-05T08:15:00') },
        { scheduledTime: '12:00', takenAt: new Date('2026-03-05T11:50:00') },
      ];
      const gaps = MedicationRecordEntity.getTimingGaps(records);
      expect(gaps).toEqual([15, -10]);
    });

    it('空配列は空を返す', () => {
      expect(MedicationRecordEntity.getTimingGaps([])).toEqual([]);
    });

    it('ちょうどの時刻で0を返す', () => {
      const records = [
        { scheduledTime: '08:00', takenAt: new Date('2026-03-05T08:00:00') },
      ];
      expect(MedicationRecordEntity.getTimingGaps(records)).toEqual([0]);
    });
  });

  describe('getAverageTimingGap', () => {
    it('平均ギャップを算出する', () => {
      const gaps = [10, 20, 30];
      expect(MedicationRecordEntity.getAverageTimingGap(gaps)).toBe(20);
    });

    it('正負が混在する場合絶対値の平均', () => {
      const gaps = [15, -10, 5];
      expect(MedicationRecordEntity.getAverageTimingGap(gaps)).toBe(10);
    });

    it('空配列は0を返す', () => {
      expect(MedicationRecordEntity.getAverageTimingGap([])).toBe(0);
    });

    it('全て0なら0を返す', () => {
      expect(MedicationRecordEntity.getAverageTimingGap([0, 0, 0])).toBe(0);
    });
  });

  describe('getTimingAccuracyLabel', () => {
    it('5分以内で「正確」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(3)).toBe('正確');
    });

    it('15分以内で「ほぼ正確」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(10)).toBe('ほぼ正確');
    });

    it('30分以内で「やや遅れ」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(25)).toBe('やや遅れ');
    });

    it('30分超で「大幅な遅れ」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(45)).toBe('大幅な遅れ');
    });

    it('0分で「正確」', () => {
      expect(MedicationRecordEntity.getTimingAccuracyLabel(0)).toBe('正確');
    });
  });
});
