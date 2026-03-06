import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (takenAt: string): MedicationRecord => ({
  id: '1',
  memberId: 'm1',
  memberName: 'テスト',
  medicationId: 'med1',
  medicationName: '薬A',
  userId: 'u1',
  takenAt: new Date(takenAt),
});

describe('MedicationRecordEntity - Duration Calc Edge Cases', () => {
  describe('getTimeSinceLastDose 境界値', () => {
    it('0分前(同時刻)は「0分前」を返す', () => {
      const now = new Date('2025-06-15T10:00:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('0分前');
    });

    it('59分前は「59分前」を返す', () => {
      const now = new Date('2025-06-15T10:59:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('59分前');
    });

    it('60分前は「1時間前」を返す', () => {
      const now = new Date('2025-06-15T11:00:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('1時間前');
    });

    it('23時間59分前は「23時間前」を返す', () => {
      const now = new Date('2025-06-16T09:59:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('23時間前');
    });

    it('24時間前は「1日前」を返す', () => {
      const now = new Date('2025-06-16T10:00:00');
      const records = [createRecord('2025-06-15T10:00:00')];
      expect(MedicationRecordEntity.getTimeSinceLastDose(records, now)).toBe('1日前');
    });
  });

  describe('getDoseIntervalStats 境界値', () => {
    it('同時刻の2記録で間隔0分', () => {
      const records = [
        createRecord('2025-06-15T10:00:00'),
        createRecord('2025-06-15T10:00:00'),
      ];
      const stats = MedicationRecordEntity.getDoseIntervalStats(records);
      expect(stats).toEqual({ averageMinutes: 0, minMinutes: 0, maxMinutes: 0 });
    });

    it('1分間隔の記録', () => {
      const records = [
        createRecord('2025-06-15T10:00:00'),
        createRecord('2025-06-15T10:01:00'),
      ];
      const stats = MedicationRecordEntity.getDoseIntervalStats(records);
      expect(stats).toEqual({ averageMinutes: 1, minMinutes: 1, maxMinutes: 1 });
    });
  });

  describe('getNextDoseEstimate 境界値', () => {
    it('日付を跨ぐ推定', () => {
      const records = [
        createRecord('2025-06-15T20:00:00'),
        createRecord('2025-06-15T23:00:00'),
      ];
      // interval: 180min → next: 23:00 + 3h = 翌02:00
      const result = MedicationRecordEntity.getNextDoseEstimate(records);
      expect(result).toEqual(new Date('2025-06-16T02:00:00'));
    });
  });
});
