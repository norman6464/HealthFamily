import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceWeeklyCompare エッジケース', () => {
  describe('getWeeklyComparison', () => {
    it('100%から0%への変化はdown', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(0, 100);
      expect(result.direction).toBe('down');
      expect(result.diff).toBe(-100);
    });

    it('0%から100%への変化はup', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(100, 0);
      expect(result.direction).toBe('up');
      expect(result.diff).toBe(100);
    });

    it('両方0%はstable', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(0, 0);
      expect(result.direction).toBe('stable');
    });

    it('差分ちょうど5%はstable', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(55, 50);
      expect(result.direction).toBe('stable');
    });
  });

  describe('getImprovementSuggestion', () => {
    it('100%は維持メッセージ', () => {
      expect(AdherenceStatsEntity.getImprovementSuggestion(100)).toContain('維持');
    });

    it('0%はリマインダーメッセージ', () => {
      expect(AdherenceStatsEntity.getImprovementSuggestion(0)).toContain('リマインダー');
    });

    it('89%はあと少しメッセージ（境界値）', () => {
      expect(AdherenceStatsEntity.getImprovementSuggestion(89)).toContain('あと少し');
    });

    it('90%は維持メッセージ（境界値）', () => {
      expect(AdherenceStatsEntity.getImprovementSuggestion(90)).toContain('維持');
    });
  });
});
