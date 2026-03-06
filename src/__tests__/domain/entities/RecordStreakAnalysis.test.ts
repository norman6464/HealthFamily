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

describe('MedicationRecordEntity 連続記録分析', () => {
  describe('getCurrentStreak', () => {
    it('空配列は0を返す', () => {
      expect(MedicationRecordEntity.getCurrentStreak([], new Date('2026-03-05'))).toBe(0);
    });

    it('今日の記録がない場合は0を返す', () => {
      const records = [createRecord(new Date('2026-03-03'))];
      expect(MedicationRecordEntity.getCurrentStreak(records, new Date('2026-03-05'))).toBe(0);
    });

    it('今日のみの記録は1を返す', () => {
      const records = [createRecord(new Date('2026-03-05'))];
      expect(MedicationRecordEntity.getCurrentStreak(records, new Date('2026-03-05'))).toBe(1);
    });

    it('3日連続は3を返す', () => {
      const records = [
        createRecord(new Date('2026-03-05')),
        createRecord(new Date('2026-03-04')),
        createRecord(new Date('2026-03-03')),
      ];
      expect(MedicationRecordEntity.getCurrentStreak(records, new Date('2026-03-05'))).toBe(3);
    });

    it('途切れた場合は途切れるまでの日数を返す', () => {
      const records = [
        createRecord(new Date('2026-03-05')),
        createRecord(new Date('2026-03-04')),
        createRecord(new Date('2026-03-02')),
      ];
      expect(MedicationRecordEntity.getCurrentStreak(records, new Date('2026-03-05'))).toBe(2);
    });
  });

  describe('getLongestStreak', () => {
    it('空配列は0を返す', () => {
      expect(MedicationRecordEntity.getLongestStreak([])).toBe(0);
    });

    it('1件のみは1を返す', () => {
      const records = [createRecord(new Date('2026-03-01'))];
      expect(MedicationRecordEntity.getLongestStreak(records)).toBe(1);
    });

    it('最長連続期間を返す', () => {
      const records = [
        createRecord(new Date('2026-03-01')),
        createRecord(new Date('2026-03-02')),
        createRecord(new Date('2026-03-03')),
        createRecord(new Date('2026-03-05')),
        createRecord(new Date('2026-03-06')),
      ];
      expect(MedicationRecordEntity.getLongestStreak(records)).toBe(3);
    });

    it('同日に複数記録があっても1日としてカウント', () => {
      const records = [
        createRecord(new Date('2026-03-01T08:00:00')),
        createRecord(new Date('2026-03-01T12:00:00')),
        createRecord(new Date('2026-03-02T08:00:00')),
      ];
      expect(MedicationRecordEntity.getLongestStreak(records)).toBe(2);
    });
  });

  describe('getStreakMessage', () => {
    it('0日は開始メッセージを返す', () => {
      expect(MedicationRecordEntity.getStreakMessage(0)).toBe('今日から始めましょう');
    });

    it('1日は継続メッセージを返す', () => {
      expect(MedicationRecordEntity.getStreakMessage(1)).toBe('記録を始めました');
    });

    it('3日は短期メッセージを返す', () => {
      expect(MedicationRecordEntity.getStreakMessage(3)).toBe('3日連続です');
    });

    it('7日は週間メッセージを返す', () => {
      expect(MedicationRecordEntity.getStreakMessage(7)).toBe('1週間継続中です');
    });

    it('30日は月間メッセージを返す', () => {
      expect(MedicationRecordEntity.getStreakMessage(30)).toBe('素晴らしい継続力です');
    });
  });
});
