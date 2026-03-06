import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity - Dose Timing Consistency Edge Cases', () => {
  describe('getDoseTimingConsistency', () => {
    it('負の値を含む', () => {
      const result = MedicationRecordEntity.getDoseTimingConsistency([-10, -10, -10]);
      expect(result).toBe(100);
    });

    it('正負混在で同じ絶対値', () => {
      const result = MedicationRecordEntity.getDoseTimingConsistency([-5, 5, -5, 5]);
      expect(result).toBe(100);
    });

    it('大きな値', () => {
      const result = MedicationRecordEntity.getDoseTimingConsistency([120, 0, 120, 0]);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('2件で同じ値', () => {
      expect(MedicationRecordEntity.getDoseTimingConsistency([10, 10])).toBe(100);
    });

    it('2件で異なる値', () => {
      const result = MedicationRecordEntity.getDoseTimingConsistency([0, 60]);
      expect(result).toBeLessThan(100);
    });

    it('大量データで一定', () => {
      const data = Array(100).fill(5);
      expect(MedicationRecordEntity.getDoseTimingConsistency(data)).toBe(100);
    });
  });

  describe('getDoseTimingLabel', () => {
    it('境界値70は安定', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(70)).toBe('安定');
    });

    it('境界値69はやや不安定', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(69)).toBe('やや不安定');
    });

    it('境界値40はやや不安定', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(40)).toBe('やや不安定');
    });

    it('境界値39は不安定', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(39)).toBe('不安定');
    });

    it('0は不安定', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(0)).toBe('不安定');
    });

    it('100は安定', () => {
      expect(MedicationRecordEntity.getDoseTimingLabel(100)).toBe('安定');
    });
  });
});
