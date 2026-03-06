import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity - Interval Check Edge Cases', () => {
  describe('getMinimumInterval', () => {
    it('6回/日で4時間', () => {
      expect(MedicationEntity.getMinimumInterval(6)).toBe(4);
    });

    it('負の値でnull', () => {
      expect(MedicationEntity.getMinimumInterval(-1)).toBeNull();
    });

    it('24回/日で1時間', () => {
      expect(MedicationEntity.getMinimumInterval(24)).toBe(1);
    });
  });

  describe('isIntervalSafe', () => {
    it('0時間経過で1回/日は危険', () => {
      expect(MedicationEntity.isIntervalSafe(0, 1)).toBe(false);
    });

    it('23.9時間で1回/日は危険', () => {
      expect(MedicationEntity.isIntervalSafe(23.9, 1)).toBe(false);
    });

    it('24時間で1回/日は安全', () => {
      expect(MedicationEntity.isIntervalSafe(24, 1)).toBe(true);
    });

    it('負の経過時間で危険', () => {
      expect(MedicationEntity.isIntervalSafe(-1, 2)).toBe(false);
    });
  });

  describe('getIntervalWarningMessage', () => {
    it('ちょうど間隔でnull', () => {
      expect(MedicationEntity.getIntervalWarningMessage(24, 1)).toBeNull();
    });

    it('間隔の1分前で警告', () => {
      const msg = MedicationEntity.getIntervalWarningMessage(7.99, 3);
      expect(msg).not.toBeNull();
    });
  });
});
