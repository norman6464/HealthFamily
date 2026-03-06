import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Pattern Analysis Edge Cases', () => {
  describe('getMedicationPatternByTimeOfDay', () => {
    it('深夜0時はnight', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['00:00']);
      expect(result.night).toBe(1);
      expect(result.morning).toBe(0);
    });

    it('早朝4時はnight', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['04:59']);
      expect(result.night).toBe(1);
    });

    it('朝5時はmorning', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['05:00']);
      expect(result.morning).toBe(1);
    });

    it('11:59はmorning', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['11:59']);
      expect(result.morning).toBe(1);
    });

    it('12:00はafternoon', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['12:00']);
      expect(result.afternoon).toBe(1);
    });

    it('16:59はafternoon', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['16:59']);
      expect(result.afternoon).toBe(1);
    });

    it('17:00はevening', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['17:00']);
      expect(result.evening).toBe(1);
    });

    it('20:59はevening', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['20:59']);
      expect(result.evening).toBe(1);
    });

    it('21:00はnight', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['21:00']);
      expect(result.night).toBe(1);
    });

    it('23:59はnight', () => {
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(['23:59']);
      expect(result.night).toBe(1);
    });

    it('大量の時刻を正しく集計', () => {
      const times = Array(100).fill('08:00');
      const result = MedicationRecordEntity.getMedicationPatternByTimeOfDay(times);
      expect(result.morning).toBe(100);
    });
  });

  describe('getMedicationPatternLabel', () => {
    it('午後型パターン', () => {
      const pattern = { morning: 0, afternoon: 5, evening: 1, night: 0 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('午後型');
    });

    it('夕方型パターン', () => {
      const pattern = { morning: 0, afternoon: 0, evening: 5, night: 1 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('夕方型');
    });

    it('ちょうど50%は均等', () => {
      const pattern = { morning: 5, afternoon: 5, evening: 0, night: 0 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('均等');
    });

    it('51%超で朝型', () => {
      const pattern = { morning: 6, afternoon: 3, evening: 1, night: 1 };
      expect(MedicationRecordEntity.getMedicationPatternLabel(pattern)).toBe('朝型');
    });
  });
});
