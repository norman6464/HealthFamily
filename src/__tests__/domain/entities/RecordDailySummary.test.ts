import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (overrides: Partial<MedicationRecord> = {}): MedicationRecord => ({
  id: `rec-${Math.random()}`,
  memberId: 'member-1',
  memberName: '太郎',
  medicationId: 'med-1',
  medicationName: '薬A',
  userId: 'user-1',
  takenAt: new Date('2026-03-05T08:00:00'),
  ...overrides,
});

describe('MedicationRecordEntity 日別サマリー', () => {
  describe('getDailySummaryText', () => {
    it('0件は服薬なしメッセージを返す', () => {
      expect(MedicationRecordEntity.getDailySummaryText(0, 0)).toBe('今日の服薬はありません');
    });

    it('全て完了の場合は完了メッセージを返す', () => {
      expect(MedicationRecordEntity.getDailySummaryText(3, 3)).toBe('全3件の服薬が完了しました');
    });

    it('一部完了の場合は進捗メッセージを返す', () => {
      expect(MedicationRecordEntity.getDailySummaryText(2, 5)).toBe('5件中2件の服薬が完了しています');
    });

    it('0件完了で予定がある場合は未完了メッセージを返す', () => {
      expect(MedicationRecordEntity.getDailySummaryText(0, 3)).toBe('5件中0件の服薬が完了しています'.replace('5', '3').replace('0', '0'));
    });
  });

  describe('getWeeklyRecordCount', () => {
    it('空配列は0を返す', () => {
      expect(MedicationRecordEntity.getWeeklyRecordCount([], new Date('2026-03-05'))).toBe(0);
    });

    it('過去7日間の記録数を返す', () => {
      const today = new Date('2026-03-05');
      const records = [
        createRecord({ takenAt: new Date('2026-03-05T08:00:00') }),
        createRecord({ takenAt: new Date('2026-03-03T08:00:00') }),
        createRecord({ takenAt: new Date('2026-03-01T08:00:00') }),
        createRecord({ takenAt: new Date('2026-02-25T08:00:00') }),
      ];
      expect(MedicationRecordEntity.getWeeklyRecordCount(records, today)).toBe(3);
    });

    it('ちょうど7日前の記録は含む', () => {
      const today = new Date('2026-03-08');
      const records = [
        createRecord({ takenAt: new Date('2026-03-01T08:00:00') }),
      ];
      expect(MedicationRecordEntity.getWeeklyRecordCount(records, today)).toBe(1);
    });

    it('8日前の記録は含まない', () => {
      const today = new Date('2026-03-09');
      const records = [
        createRecord({ takenAt: new Date('2026-03-01T08:00:00') }),
      ];
      expect(MedicationRecordEntity.getWeeklyRecordCount(records, today)).toBe(0);
    });
  });

  describe('getRecordTrendLabel', () => {
    it('増加傾向は増加ラベルを返す', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(10, 5)).toBe('増加傾向');
    });

    it('減少傾向は減少ラベルを返す', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(3, 8)).toBe('減少傾向');
    });

    it('同数は横ばいラベルを返す', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(5, 5)).toBe('横ばい');
    });

    it('差が1以内は横ばいとする', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(5, 6)).toBe('横ばい');
      expect(MedicationRecordEntity.getRecordTrendLabel(6, 5)).toBe('横ばい');
    });

    it('前期間0で今期間があれば増加', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(5, 0)).toBe('増加傾向');
    });
  });
});
