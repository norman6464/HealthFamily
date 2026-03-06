import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Dose Timing Consistency', () => {
  describe('getDoseTimingConsistency', () => {
    it('空配列は0', () => {
      expect(MedicationRecordEntity.getDoseTimingConsistency([])).toBe(0);
    });

    it('1件のみは100', () => {
      expect(MedicationRecordEntity.getDoseTimingConsistency([0])).toBe(100);
    });

    it('全て同じ時間差は100', () => {
      expect(MedicationRecordEntity.getDoseTimingConsistency([5, 5, 5, 5])).toBe(100);
    });

    it('ばらつきがある場合はスコアが下がる', () => {
      const result = MedicationRecordEntity.getDoseTimingConsistency([0, 30, 0, 60]);
      expect(result).toBeLessThan(100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('大きなばらつき', () => {
      const result = MedicationRecordEntity.getDoseTimingConsistency([0, 120, 0, 120]);
      expect(result).toBeLessThan(50);
    });

    it('全て0は100', () => {
      expect(MedicationRecordEntity.getDoseTimingConsistency([0, 0, 0])).toBe(100);
    });
  });

  describe('getDoseTimingLabel', () => {
    it('高い一貫性', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(80)).toBe('安定');
    });

    it('中程度の一貫性', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(50)).toBe('やや不安定');
    });

    it('低い一貫性', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(20)).toBe('不安定');
    });
  });
});
