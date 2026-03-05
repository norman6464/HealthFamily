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

  describe('getActiveDaysCount', () => {
    it('空配列は7を返す（毎日）', () => {
      expect(AdherenceStatsEntity.getActiveDaysCount([])).toBe(7);
    });

    it('指定された曜日数を返す', () => {
      expect(AdherenceStatsEntity.getActiveDaysCount(['mon', 'wed', 'fri'])).toBe(3);
    });
  });

  describe('calculateWeeklyExpected', () => {
    it('週間期待数を正しく算出する', () => {
      const schedules = [
        { daysOfWeek: ['mon', 'wed', 'fri'] },
        { daysOfWeek: [] },
      ];
      expect(AdherenceStatsEntity.calculateWeeklyExpected(schedules)).toBe(10);
    });

    it('空配列の場合0を返す', () => {
      expect(AdherenceStatsEntity.calculateWeeklyExpected([])).toBe(0);
    });
  });

  describe('calculateMonthlyExpected', () => {
    it('月間期待数を正しく算出する', () => {
      const schedules = [{ daysOfWeek: [] }]; // 毎日 = 7日/週
      const expected = Math.round(7 * (30 / 7));
      expect(AdherenceStatsEntity.calculateMonthlyExpected(schedules)).toBe(expected);
    });
  });

  describe('calculateRate', () => {
    it('遵守率を正しく算出する', () => {
      expect(AdherenceStatsEntity.calculateRate(7, 10)).toBe(70);
    });

    it('100%を超えない', () => {
      expect(AdherenceStatsEntity.calculateRate(15, 10)).toBe(100);
    });

    it('期待値0の場合は0を返す', () => {
      expect(AdherenceStatsEntity.calculateRate(5, 0)).toBe(0);
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
