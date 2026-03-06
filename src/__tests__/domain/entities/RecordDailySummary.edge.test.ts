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

describe('MedicationRecordEntity 日別サマリー エッジケース', () => {
  describe('getDailySummaryText', () => {
    it('大量の完了でも正しいメッセージを返す', () => {
      expect(MedicationRecordEntity.getDailySummaryText(100, 100)).toBe('全100件の服薬が完了しました');
    });

    it('1件中1件完了は全完了メッセージを返す', () => {
      expect(MedicationRecordEntity.getDailySummaryText(1, 1)).toBe('全1件の服薬が完了しました');
    });
  });

  describe('getWeeklyRecordCount', () => {
    it('7日以上前の記録は含めない', () => {
      const today = new Date('2026-03-10');
      const records = [
        createRecord(new Date('2026-03-02T08:00:00')),
      ];
      expect(MedicationRecordEntity.getWeeklyRecordCount(records, today)).toBe(0);
    });

    it('同日に複数記録がある場合は全てカウントする', () => {
      const today = new Date('2026-03-05');
      const records = [
        createRecord(new Date('2026-03-05T08:00:00')),
        createRecord(new Date('2026-03-05T12:00:00')),
        createRecord(new Date('2026-03-05T18:00:00')),
      ];
      expect(MedicationRecordEntity.getWeeklyRecordCount(records, today)).toBe(3);
    });
  });

  describe('getRecordTrendLabel', () => {
    it('両方0は横ばいを返す', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(0, 0)).toBe('横ばい');
    });

    it('差が2は増加傾向を返す', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(5, 3)).toBe('増加傾向');
    });

    it('差が-2は減少傾向を返す', () => {
      expect(MedicationRecordEntity.getRecordTrendLabel(3, 5)).toBe('減少傾向');
    });
  });
});
