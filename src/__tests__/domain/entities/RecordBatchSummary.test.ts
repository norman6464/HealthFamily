import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity, MedicationRecord } from '@/domain/entities/MedicationRecord';

const createRecord = (overrides: Partial<MedicationRecord> = {}): MedicationRecord => ({
  id: '1',
  memberId: 'm1',
  memberName: 'テスト太郎',
  medicationId: 'med1',
  medicationName: 'テスト薬',
  userId: 'u1',
  takenAt: new Date('2025-06-15T08:00:00'),
  ...overrides,
});

describe('MedicationRecordEntity 記録バッチサマリー', () => {
  describe('getBatchSummary', () => {
    it('0件の場合は記録なしメッセージを返す', () => {
      expect(MedicationRecordEntity.getBatchSummary(0, 0)).toContain('記録はありません');
    });

    it('全件完了の場合は完了メッセージを返す', () => {
      const msg = MedicationRecordEntity.getBatchSummary(5, 5);
      expect(msg).toContain('全');
      expect(msg).toContain('完了');
    });

    it('一部完了の場合は件数を含むメッセージを返す', () => {
      const msg = MedicationRecordEntity.getBatchSummary(3, 5);
      expect(msg).toContain('3');
      expect(msg).toContain('5');
    });
  });

  describe('getMemberRecordCounts', () => {
    it('空配列は空オブジェクトを返す', () => {
      expect(MedicationRecordEntity.getMemberRecordCounts([])).toEqual({});
    });

    it('メンバー別に集計する', () => {
      const records = [
        createRecord({ memberId: 'm1', memberName: '太郎' }),
        createRecord({ memberId: 'm1', memberName: '太郎' }),
        createRecord({ memberId: 'm2', memberName: '花子' }),
      ];
      const counts = MedicationRecordEntity.getMemberRecordCounts(records);
      expect(counts['太郎']).toBe(2);
      expect(counts['花子']).toBe(1);
    });

    it('1メンバーのみの場合', () => {
      const records = [
        createRecord({ memberName: '太郎' }),
        createRecord({ memberName: '太郎' }),
      ];
      const counts = MedicationRecordEntity.getMemberRecordCounts(records);
      expect(counts['太郎']).toBe(2);
    });
  });

  describe('getCompletionRateMessage', () => {
    it('100%は完璧メッセージを返す', () => {
      const msg = MedicationRecordEntity.getCompletionRateMessage(100);
      expect(msg).toContain('完璧');
    });

    it('80%以上は良好メッセージを返す', () => {
      const msg = MedicationRecordEntity.getCompletionRateMessage(85);
      expect(msg).toContain('良');
    });

    it('50%以上は頑張りメッセージを返す', () => {
      const msg = MedicationRecordEntity.getCompletionRateMessage(60);
      expect(msg).toContain('もう少し');
    });

    it('50%未満は励ましメッセージを返す', () => {
      const msg = MedicationRecordEntity.getCompletionRateMessage(30);
      expect(msg).toContain('少しずつ');
    });
  });
});
