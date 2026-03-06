import { describe, it, expect } from 'vitest';
import { HealthLogEntity } from '@/domain/entities/HealthLog';

describe('HealthLogEntity 症状トレンド エッジケース', () => {
  describe('getSymptomTrendMessage', () => {
    it('差が2の場合は増加と判定する', () => {
      const msg = HealthLogEntity.getSymptomTrendMessage(4, 2);
      expect(msg).toContain('増加');
    });

    it('差が-2の場合は減少と判定する', () => {
      const msg = HealthLogEntity.getSymptomTrendMessage(1, 3);
      expect(msg).toContain('減少');
    });

    it('両方0の場合は変化なし', () => {
      const msg = HealthLogEntity.getSymptomTrendMessage(0, 0);
      expect(msg).toContain('変化');
    });
  });

  describe('getConditionImprovementRate', () => {
    it('5から1への悪化は-4を返す', () => {
      expect(HealthLogEntity.getConditionImprovementRate(1, 5)).toBe(-4);
    });

    it('1から5への改善は4を返す', () => {
      expect(HealthLogEntity.getConditionImprovementRate(5, 1)).toBe(4);
    });
  });

  describe('getRecordFrequencyMessage', () => {
    it('30日中15日は順調', () => {
      const msg = HealthLogEntity.getRecordFrequencyMessage(15, 30);
      expect(msg).toContain('順調');
    });

    it('30日中30日は毎日', () => {
      const msg = HealthLogEntity.getRecordFrequencyMessage(30, 30);
      expect(msg).toContain('毎日');
    });
  });
});
