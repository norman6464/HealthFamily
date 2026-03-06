import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (takenAt: string | Date): MedicationRecord => ({
  id: '1',
  memberId: 'm1',
  memberName: 'テスト',
  medicationId: 'med1',
  medicationName: '薬A',
  userId: 'u1',
  takenAt: new Date(takenAt),
});

describe('MedicationRecordEntity - Duration Calc', () => {
  describe('getTimeSinceLastDose', () => {
    it('記録なしの場合nullを返す', () => {
      const now = new Date('2025-06-15T10:00:00');
      expect(MedicationRecordEntity.getTimeSinceLastDose([], now)).toBeNull();
    });

    it('30分前の服薬で「30分前」を返す', () => {
      const now = new Date('2025-06-15T10:30:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('30分前');
    });

    it('2時間前の服薬で「2時間前」を返す', () => {
      const now = new Date('2025-06-15T12:00:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('2時間前');
    });

    it('1時間30分前の服薬で「1時間前」を返す', () => {
      const now = new Date('2025-06-15T11:30:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('1時間前');
    });

    it('2日前の服薬で「2日前」を返す', () => {
      const now = new Date('2025-06-17T10:00:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('2日前');
    });

    it('複数記録がある場合最新の記録を基準にする', () => {
      const now = new Date('2025-06-15T11:00:00');
      const records = [
        createRecord('2025-06-15T10:00:00'),
        createRecord('2025-06-15T10:30:00'),
        createRecord('2025-06-15T09:00:00'),
      ];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('30分前');
    });
  });

  describe('getDoseIntervalStats', () => {
    it('記録なしの場合nullを返す', () => {
      expect(MedicationRecordEntity.getDoseIntervalStats([])).toBeNull();
    });

    it('1件の記録の場合nullを返す', () => {
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getDoseIntervalStats(records)).toBeNull();
    });

    it('2件の記録で正しい統計を返す', () => {
      const records = [
        createRecord('2025-06-15T10:00:00'),
        createRecord('2025-06-15T14:00:00'),
      ];
      const stats = MedicationRecordEntity.getDoseIntervalStats(records);
      expect(stats).toEqual({ averageMinutes: 240, minMinutes: 240, maxMinutes: 240 });
    });

    it('3件の記録で正しい統計を返す', () => {
      const records = [
        createRecord('2025-06-15T08:00:00'),
        createRecord('2025-06-15T12:00:00'),
        createRecord('2025-06-15T18:00:00'),
      ];
      const stats = MedicationRecordEntity.getDoseIntervalStats(records);
      expect(stats).toEqual({ averageMinutes: 300, minMinutes: 240, maxMinutes: 360 });
    });

    it('順序がバラバラでもソートして正しく計算する', () => {
      const records = [
        createRecord('2025-06-15T18:00:00'),
        createRecord('2025-06-15T08:00:00'),
        createRecord('2025-06-15T12:00:00'),
      ];
      const stats = MedicationRecordEntity.getDoseIntervalStats(records);
      expect(stats).toEqual({ averageMinutes: 300, minMinutes: 240, maxMinutes: 360 });
    });
  });

  describe('getNextDoseEstimate', () => {
    it('記録なしの場合nullを返す', () => {
      expect(MedicationRecordEntity.getNextDoseEstimate([])).toBeNull();
    });

    it('1件の記録の場合nullを返す', () => {
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getNextDoseEstimate(records)).toBeNull();
    });

    it('平均間隔に基づいた次回予定時刻を返す', () => {
      const records = [
        createRecord('2025-06-15T08:00:00'),
        createRecord('2025-06-15T12:00:00'),
        createRecord('2025-06-15T16:00:00'),
      ];
      const result = MedicationRecordEntity.getNextDoseEstimate(records);
      expect(result).toEqual(new Date('2025-06-15T20:00:00'));
    });

    it('異なる間隔でも平均を使って推定する', () => {
      const records = [
        createRecord('2025-06-15T06:00:00'),
        createRecord('2025-06-15T10:00:00'),
        createRecord('2025-06-15T16:00:00'),
      ];
      // intervals: 240min, 360min → avg 300min = 5h
      // last: 16:00 + 5h = 21:00
      const result = MedicationRecordEntity.getNextDoseEstimate(records);
      expect(result).toEqual(new Date('2025-06-15T21:00:00'));
    });
  });
});
