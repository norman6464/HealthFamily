import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity 症状トレンドメッセージ', () => {
  describe('getSymptomTrendMessage', () => {
    it('増加の場合は増加メッセージを返す', () => {
      const msg = HealthLogEntity.getSymptomTrendMessage(5, 2);
      expect(msg).toContain('増加');
    });

    it('減少の場合は減少メッセージを返す', () => {
      const msg = HealthLogEntity.getSymptomTrendMessage(2, 5);
      expect(msg).toContain('減少');
    });

    it('同数の場合は変化なしメッセージを返す', () => {
      const msg = HealthLogEntity.getSymptomTrendMessage(3, 3);
      expect(msg).toContain('変化');
    });

    it('差が1以内は変化なしと判定する', () => {
      const msg = HealthLogEntity.getSymptomTrendMessage(3, 2);
      expect(msg).toContain('変化');
    });
  });

  describe('getConditionImprovementRate', () => {
    it('改善した場合は正の値を返す', () => {
      expect(HealthLogEntity.getConditionImprovementRate(4, 3)).toBeGreaterThan(0);
    });

    it('悪化した場合は負の値を返す', () => {
      expect(HealthLogEntity.getConditionImprovementRate(2, 3)).toBeLessThan(0);
    });

    it('同じ場合は0を返す', () => {
      expect(HealthLogEntity.getConditionImprovementRate(3, 3)).toBe(0);
    });

    it('1から5への改善は正の値', () => {
      expect(HealthLogEntity.getConditionImprovementRate(5, 1)).toBeGreaterThan(0);
    });
  });

  describe('getRecordFrequencyMessage', () => {
    it('毎日記録の場合は完璧メッセージ', () => {
      const msg = HealthLogEntity.getRecordFrequencyMessage(7, 7);
      expect(msg).toContain('毎日');
    });

    it('半分以上の場合は順調メッセージ', () => {
      const msg = HealthLogEntity.getRecordFrequencyMessage(5, 7);
      expect(msg).toContain('順調');
    });

    it('少ない場合は促進メッセージ', () => {
      const msg = HealthLogEntity.getRecordFrequencyMessage(1, 7);
      expect(msg).toContain('記録');
    });

    it('0件の場合は開始メッセージ', () => {
      const msg = HealthLogEntity.getRecordFrequencyMessage(0, 7);
      expect(msg).toContain('始め');
    });
  });
});
