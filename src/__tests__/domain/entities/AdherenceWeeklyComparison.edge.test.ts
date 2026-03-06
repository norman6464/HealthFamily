import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity 週次比較 エッジケース', () => {
  describe('getWeeklyComparisonDetail', () => {
    it('境界値5%差はstableを返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(75, 70);
      expect(result.direction).toBe('stable');
    });

    it('境界値6%差はupを返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(76, 70);
      expect(result.direction).toBe('up');
    });

    it('0%から100%への変化はupを返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(100, 0);
      expect(result.direction).toBe('up');
      expect(result.diff).toBe(100);
    });

    it('100%から0%への変化はdownを返す', () => {
      const result = AdherenceStatsEntity.getWeeklyComparisonDetail(0, 100);
      expect(result.direction).toBe('down');
      expect(result.diff).toBe(100);
    });
  });

  describe('getRateChangeLabel', () => {
    it('大きな正の値', () => {
      expect(AdherenceStatsEntity.getRateChangeLabel(100)).toBe('+100%');
    });

    it('大きな負の値', () => {
      expect(AdherenceStatsEntity.getRateChangeLabel(-100)).toBe('-100%');
    });
  });

  describe('getMotivationMessage', () => {
    it('境界値90%', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(90);
      expect(msg).toBe('この調子で続けましょう');
    });

    it('境界値70%', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(70);
      expect(msg).toContain('良いペース');
    });

    it('境界値50%', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(50);
      expect(msg).toContain('習慣');
    });

    it('0%', () => {
      const msg = AdherenceStatsEntity.getMotivationMessage(0);
      expect(msg.length).toBeGreaterThan(0);
    });
  });
});
