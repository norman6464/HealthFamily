import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (takenAt: Date): MedicationRecord => ({
  id: `rec-${Math.random()}`,
  memberId: 'member-1',
  memberName: '太郎',
  medicationId: 'med-1',
  medicationName: '薬A',
  userId: 'user-1',
  takenAt,
});

describe('RecordStreakAnalysis エッジケース', () => {
  describe('getCurrentStreak エッジケース', () => {
    it('昨日の記録のみの場合は0を返す', () => {
      const records = [createRecord(new Date('2026-03-04'))];
      expect(MedicationRecordEntity.getCurrentStreak(records, new Date('2026-03-05'))).toBe(0);
    });

    it('同日に複数記録があっても1日としてカウント', () => {
      const records = [
        createRecord(new Date('2026-03-05T08:00:00')),
        createRecord(new Date('2026-03-05T12:00:00')),
        createRecord(new Date('2026-03-05T18:00:00')),
      ];
      expect(MedicationRecordEntity.getCurrentStreak(records, new Date('2026-03-05'))).toBe(1);
    });

    it('5日連続は5を返す', () => {
      const records = [
        createRecord(new Date('2026-03-05')),
        createRecord(new Date('2026-03-04')),
        createRecord(new Date('2026-03-03')),
        createRecord(new Date('2026-03-02')),
        createRecord(new Date('2026-03-01')),
      ];
      expect(MedicationRecordEntity.getCurrentStreak(records, new Date('2026-03-05'))).toBe(5);
    });
  });

  describe('getLongestStreak エッジケース', () => {
    it('全て同日の記録は1を返す', () => {
      const records = [
        createRecord(new Date('2026-03-01T08:00:00')),
        createRecord(new Date('2026-03-01T12:00:00')),
        createRecord(new Date('2026-03-01T18:00:00')),
      ];
      expect(MedicationRecordEntity.getLongestStreak(records)).toBe(1);
    });

    it('2つの連続期間で長い方を返す', () => {
      const records = [
        createRecord(new Date('2026-03-01')),
        createRecord(new Date('2026-03-02')),
        createRecord(new Date('2026-03-05')),
        createRecord(new Date('2026-03-06')),
        createRecord(new Date('2026-03-07')),
      ];
      expect(MedicationRecordEntity.getLongestStreak(records)).toBe(3);
    });
  });

  describe('getStreakMessage エッジケース', () => {
    it('2日は連続メッセージを返す', () => {
      expect(MedicationRecordEntity.getStreakMessage(2)).toBe('2日連続です');
    });

    it('6日はまだ週間メッセージではない', () => {
      expect(MedicationRecordEntity.getStreakMessage(6)).toBe('6日連続です');
    });

    it('14日は順調メッセージを返す', () => {
      expect(MedicationRecordEntity.getStreakMessage(14)).toBe('順調に継続しています');
    });

    it('29日はまだ月間メッセージではない', () => {
      expect(MedicationRecordEntity.getStreakMessage(29)).toBe('順調に継続しています');
    });
  });
});
