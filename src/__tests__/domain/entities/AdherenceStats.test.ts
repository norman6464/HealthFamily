import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity', () => {
  describe('getRateLevel', () => {
    it('90%以上はexcellentを返す', () => {
      expect(AdherenceStatsEntity.getRateLevel(100)).toBe('excellent');
      expect(AdherenceStatsEntity.getRateLevel(90)).toBe('excellent');
    });

    it('70-89%はgoodを返す', () => {
      expect(AdherenceStatsEntity.getRateLevel(89)).toBe('good');
      expect(AdherenceStatsEntity.getRateLevel(70)).toBe('good');
    });

    it('50-69%はwarningを返す', () => {
      expect(AdherenceStatsEntity.getRateLevel(69)).toBe('warning');
      expect(AdherenceStatsEntity.getRateLevel(50)).toBe('warning');
    });

    it('50%未満はpoorを返す', () => {
      expect(AdherenceStatsEntity.getRateLevel(49)).toBe('poor');
      expect(AdherenceStatsEntity.getRateLevel(0)).toBe('poor');
    });
  });

  describe('getRateLabel', () => {
    it('全レベルのラベルが正しい', () => {
      expect(AdherenceStatsEntity.getRateLabel(95)).toBe('優秀');
      expect(AdherenceStatsEntity.getRateLabel(75)).toBe('良好');
      expect(AdherenceStatsEntity.getRateLabel(55)).toBe('注意');
      expect(AdherenceStatsEntity.getRateLabel(30)).toBe('要改善');
    });
  });

  describe('data', () => {
    it('統計データにアクセスできる', () => {
      const stats = {
        overall: { weeklyRate: 85, monthlyRate: 78, weeklyCount: 12, monthlyCount: 45 },
        members: [],
      };
      const entity = new AdherenceStatsEntity(stats);
      expect(entity.data).toBe(stats);
    });
  });
});
