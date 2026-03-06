import { describe, it, expect } from 'vitest';
import { MedicationRecordEntity } from '@/domain/entities/MedicationRecord';

describe('MedicationRecordEntity 記録バッチサマリー エッジケース', () => {
  describe('getBatchSummary', () => {
    it('1件中1件完了は全完了メッセージ', () => {
      const msg = MedicationRecordEntity.getBatchSummary(1, 1);
      expect(msg).toContain('完了');
    });

    it('0件中0件は記録なし', () => {
      expect(MedicationRecordEntity.getBatchSummary(0, 0)).toContain('記録はありません');
    });
  });

  describe('getCompletionRateMessage', () => {
    it('境界値80%は良い調子', () => {
      expect(MedicationRecordEntity.getCompletionRateMessage(80)).toContain('良');
    });

    it('境界値79%はもう少し', () => {
      expect(MedicationRecordEntity.getCompletionRateMessage(79)).toContain('もう少し');
    });

    it('境界値50%はもう少し', () => {
      expect(MedicationRecordEntity.getCompletionRateMessage(50)).toContain('もう少し');
    });

    it('境界値49%は少しずつ', () => {
      expect(MedicationRecordEntity.getCompletionRateMessage(49)).toContain('少しずつ');
    });

    it('0%は少しずつ', () => {
      expect(MedicationRecordEntity.getCompletionRateMessage(0)).toContain('少しずつ');
    });
  });
});
