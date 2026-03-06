import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity 週間比較', () => {
  describe('getWeeklyComparison', () => {
    it('改善の場合は正の差分を返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(80, 60);
      expect(result.diff).toBe(20);
      expect(result.direction).toBe('up');
    });

    it('悪化の場合は負の差分を返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(50, 70);
      expect(result.diff).toBe(-20);
      expect(result.direction).toBe('down');
    });

    it('変化なしの場合は0を返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(80, 80);
      expect(result.diff).toBe(0);
      expect(result.direction).toBe('stable');
    });

    it('5%以内の変化はstableとする', () => {
      const result = AdherenceStatsEntity.getWeeklyComparison(83, 80);
      expect(result.direction).toBe('stable');
    });
  });

  describe('getWeeklyTrendLabel', () => {
    it('upは改善を返す', () => {
      expect(AdherenceStatsEntity.getWeeklyTrendLabel('up')).toBe('改善');
    });

    it('downは低下を返す', () => {
      expect(AdherenceStatsEntity.getWeeklyTrendLabel('down')).toBe('低下');
    });

    it('stableは維持を返す', () => {
      expect(AdherenceStatsEntity.getWeeklyTrendLabel('stable')).toBe('維持');
    });
  });

  describe('getImprovementSuggestion', () => {
    it('90%以上は維持メッセージ', () => {
      const msg = AdherenceStatsEntity.getImprovementSuggestion(95);
      expect(msg).toContain('維持');
    });

    it('70%以上はもう少しメッセージ', () => {
      const msg = AdherenceStatsEntity.getImprovementSuggestion(75);
      expect(msg).toContain('あと少し');
    });

    it('50%以上は習慣化メッセージ', () => {
      const msg = AdherenceStatsEntity.getImprovementSuggestion(55);
      expect(msg).toContain('習慣');
    });

    it('50%未満はリマインダーメッセージ', () => {
      const msg = AdherenceStatsEntity.getImprovementSuggestion(30);
      expect(msg).toContain('リマインダー');
    });
  });
});
