import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity ストリーク評価', () => {
  describe('getStreakRank', () => {
    it('0日はbronzeを返す', () => {
      expect(AdherenceStatsEntity.getStreakRank(0)).toBe('bronze');
    });

    it('6日はbronzeを返す', () => {
      expect(AdherenceStatsEntity.getStreakRank(6)).toBe('bronze');
    });

    it('7日はsilverを返す(境界)', () => {
      expect(AdherenceStatsEntity.getStreakRank(7)).toBe('silver');
    });

    it('29日はsilverを返す', () => {
      expect(AdherenceStatsEntity.getStreakRank(29)).toBe('silver');
    });

    it('30日はgoldを返す(境界)', () => {
      expect(AdherenceStatsEntity.getStreakRank(30)).toBe('gold');
    });

    it('89日はgoldを返す', () => {
      expect(AdherenceStatsEntity.getStreakRank(89)).toBe('gold');
    });

    it('90日はplatinumを返す(境界)', () => {
      expect(AdherenceStatsEntity.getStreakRank(90)).toBe('platinum');
    });

    it('365日はplatinumを返す', () => {
      expect(AdherenceStatsEntity.getStreakRank(365)).toBe('platinum');
    });
  });

  describe('getStreakRankStyle', () => {
    it('bronzeは茶色系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getStreakRankStyle('bronze');
      expect(style.text).toContain('orange');
    });

    it('silverは灰色系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getStreakRankStyle('silver');
      expect(style.text).toContain('gray');
    });

    it('goldは黄色系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getStreakRankStyle('gold');
      expect(style.text).toContain('yellow');
    });

    it('platinumは紫系スタイルを返す', () => {
      const style = AdherenceStatsEntity.getStreakRankStyle('platinum');
      expect(style.text).toContain('purple');
    });
  });

  describe('isStreakMilestone', () => {
    it('7日はマイルストーンを返す', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(7)).toBe(true);
    });

    it('14日はマイルストーンを返す', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(14)).toBe(true);
    });

    it('30日はマイルストーンを返す', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(30)).toBe(true);
    });

    it('60日はマイルストーンを返す', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(60)).toBe(true);
    });

    it('90日はマイルストーンを返す', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(90)).toBe(true);
    });

    it('100日はマイルストーンを返す', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(100)).toBe(true);
    });

    it('365日はマイルストーンを返す', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(365)).toBe(true);
    });

    it('8日はマイルストーンでない', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(8)).toBe(false);
    });

    it('0日はマイルストーンでない', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(0)).toBe(false);
    });

    it('15日はマイルストーンでない', () => {
      expect(AdherenceStatsEntity.isStreakMilestone(15)).toBe(false);
    });
  });
});
