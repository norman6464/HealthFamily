import { MedicationEntity } from '@/domain/entities/Medication';

describe('MedicationEntity - Interval Check', () => {
  describe('getMinimumInterval', () => {
    it('1日1回で24時間', () => {
      expect(MedicationEntity.getMinimumInterval(1)).toBe(24);
    });

    it('1日2回で12時間', () => {
      expect(MedicationEntity.getMinimumInterval(2)).toBe(12);
    });

    it('1日3回で8時間', () => {
      expect(MedicationEntity.getMinimumInterval(3)).toBe(8);
    });

    it('1日4回で6時間', () => {
      expect(MedicationEntity.getMinimumInterval(4)).toBe(6);
    });

    it('0回でnullを返す', () => {
      expect(MedicationEntity.getMinimumInterval(0)).toBeNull();
    });
  });

  describe('isIntervalSafe', () => {
    it('最小間隔以上で安全', () => {
      expect(MedicationEntity.isIntervalSafe(8, 3)).toBe(true);
    });

    it('最小間隔未満で危険', () => {
      expect(MedicationEntity.isIntervalSafe(4, 3)).toBe(false);
    });

    it('ちょうど最小間隔で安全', () => {
      expect(MedicationEntity.isIntervalSafe(12, 2)).toBe(true);
    });

    it('0回/日でtrue(制限なし)', () => {
      expect(MedicationEntity.isIntervalSafe(1, 0)).toBe(true);
    });
  });

  describe('getIntervalWarningMessage', () => {
    it('安全な間隔でnullを返す', () => {
      expect(MedicationEntity.getIntervalWarningMessage(10, 3)).toBeNull();
    });

    it('危険な間隔で警告メッセージを返す', () => {
      const msg = MedicationEntity.getIntervalWarningMessage(2, 3);
      expect(msg).toContain('8時間');
    });

    it('1時間未満の経過で警告', () => {
      const msg = MedicationEntity.getIntervalWarningMessage(0.5, 2);
      expect(msg).toContain('12時間');
    });

    it('0回/日でnullを返す', () => {
      expect(MedicationEntity.getIntervalWarningMessage(5, 0)).toBeNull();
    });
  });
});
