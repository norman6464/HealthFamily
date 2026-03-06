import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Pattern Analysis', () => {
  describe('getMedicationPatternByTimeOfDay', () => {
    it('時間帯別の服薬回数を集計', () => {
      const times = ['07:00', '08:00', '12:30', '18:00', '22:00'];
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(times);
      expect(result.morning).toBe(2);
      expect(result.afternoon).toBe(1);
      expect(result.evening).toBe(1);
      expect(result.night).toBe(1);
    });

    it('空配列は全て0', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay([]);
      expect(result.morning).toBe(0);
      expect(result.afternoon).toBe(0);
      expect(result.evening).toBe(0);
      expect(result.night).toBe(0);
    });

    it('全て同じ時間帯', () => {
      const times = ['08:00', '09:00', '10:00'];
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(times);
      expect(result.morning).toBe(3);
    });
  });

  describe('getMedicationPatternLabel', () => {
    it('朝型パターン', () => {
      const pattern = { morning: 5, afternoon: 1, evening: 0, night: 0 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('朝型');
    });

    it('均等パターン', () => {
      const pattern = { morning: 2, afternoon: 2, evening: 2, night: 2 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('均等');
    });

    it('夜型パターン', () => {
      const pattern = { morning: 0, afternoon: 1, evening: 1, night: 5 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('夜型');
    });

    it('全て0は均等', () => {
      const pattern = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('均等');
    });
  });
});
