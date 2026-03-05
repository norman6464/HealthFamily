import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity - Streak', () => {
  describe('calculateStreak', () => {
    it('毎日記録がある場合、連続日数を正しく算出する', () => {
      const today = new Date('2026-03-05');
      const recordDates = [
        new Date('2026-03-05'),
        new Date('2026-03-04'),
        new Date('2026-03-03'),
        new Date('2026-03-02'),
      ];
      expect(AdherenceStatsEntity.calculateStreak(recordDates, today)).toBe(4);
    });

    it('今日の記録がない場合は0を返す', () => {
      const today = new Date('2026-03-05');
      const recordDates = [
        new Date('2026-03-04'),
        new Date('2026-03-03'),
      ];
      expect(AdherenceStatsEntity.calculateStreak(recordDates, today)).toBe(0);
    });

    it('途中で途切れた場合、途切れるまでの日数を返す', () => {
      const today = new Date('2026-03-05');
      const recordDates = [
        new Date('2026-03-05'),
        new Date('2026-03-04'),
        // 3/3はスキップ
        new Date('2026-03-02'),
        new Date('2026-03-01'),
      ];
      expect(AdherenceStatsEntity.calculateStreak(recordDates, today)).toBe(2);
    });

    it('記録がない場合は0を返す', () => {
      const today = new Date('2026-03-05');
      expect(AdherenceStatsEntity.calculateStreak([], today)).toBe(0);
    });

    it('同じ日に複数記録があっても1日としてカウントする', () => {
      const today = new Date('2026-03-05');
      const recordDates = [
        new Date('2026-03-05T08:00:00'),
        new Date('2026-03-05T12:00:00'),
        new Date('2026-03-05T20:00:00'),
        new Date('2026-03-04T09:00:00'),
        new Date('2026-03-04T21:00:00'),
      ];
      expect(AdherenceStatsEntity.calculateStreak(recordDates, today)).toBe(2);
    });
  });

  describe('calculateLongestStreak', () => {
    it('最長連続日数を正しく算出する', () => {
      const recordDates = [
        new Date('2026-03-05'),
        new Date('2026-03-04'),
        // gap
        new Date('2026-03-01'),
        new Date('2026-02-28'),
        new Date('2026-02-27'),
        new Date('2026-02-26'),
      ];
      expect(AdherenceStatsEntity.calculateLongestStreak(recordDates)).toBe(4);
    });

    it('記録がない場合は0を返す', () => {
      expect(AdherenceStatsEntity.calculateLongestStreak([])).toBe(0);
    });

    it('全て連続している場合はその日数を返す', () => {
      const recordDates = [
        new Date('2026-03-05'),
        new Date('2026-03-04'),
        new Date('2026-03-03'),
      ];
      expect(AdherenceStatsEntity.calculateLongestStreak(recordDates)).toBe(3);
    });

    it('全て離れている場合は1を返す', () => {
      const recordDates = [
        new Date('2026-03-05'),
        new Date('2026-03-03'),
        new Date('2026-03-01'),
      ];
      expect(AdherenceStatsEntity.calculateLongestStreak(recordDates)).toBe(1);
    });
  });

  describe('getStreakMessage', () => {
    it('0日の場合は応援メッセージを返す', () => {
      const message = AdherenceStatsEntity.getStreakMessage(0);
      expect(message).toBe('今日から始めよう');
    });

    it('1-6日の場合は継続メッセージを返す', () => {
      expect(AdherenceStatsEntity.getStreakMessage(1)).toBe('良いスタート');
      expect(AdherenceStatsEntity.getStreakMessage(6)).toBe('良いスタート');
    });

    it('7-29日の場合は称賛メッセージを返す', () => {
      expect(AdherenceStatsEntity.getStreakMessage(7)).toBe('素晴らしい習慣');
      expect(AdherenceStatsEntity.getStreakMessage(29)).toBe('素晴らしい習慣');
    });

    it('30日以上の場合は最高評価メッセージを返す', () => {
      expect(AdherenceStatsEntity.getStreakMessage(30)).toBe('完璧な継続');
      expect(AdherenceStatsEntity.getStreakMessage(100)).toBe('完璧な継続');
    });
  });
});
