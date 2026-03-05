import { describe, it, expect } from 'vitest';
import { AdherenceStatsEntity } from '@/domain/entities/AdherenceStats';

describe('AdherenceStatsEntity エッジケース', () => {
  describe('calculateStreak', () => {
    it('今日の記録がない場合は0を返す', () => {
      const yesterday = new Date('2026-03-04T10:00:00');
      const today = new Date('2026-03-05T10:00:00');
      expect(AdherenceStatsEntity.calculateStreak([yesterday], today)).toBe(0);
    });

    it('今日のみの記録で1を返す', () => {
      const today = new Date('2026-03-05T10:00:00');
      const record = new Date('2026-03-05T08:00:00');
      expect(AdherenceStatsEntity.calculateStreak([record], today)).toBe(1);
    });

    it('連続3日の記録で3を返す', () => {
      const today = new Date('2026-03-05T10:00:00');
      const records = [
        new Date('2026-03-05T08:00:00'),
        new Date('2026-03-04T08:00:00'),
        new Date('2026-03-03T08:00:00'),
      ];
      expect(AdherenceStatsEntity.calculateStreak(records, today)).toBe(3);
    });

    it('途中に抜けがある場合はそこで止まる', () => {
      const today = new Date('2026-03-05T10:00:00');
      const records = [
        new Date('2026-03-05T08:00:00'),
        new Date('2026-03-04T08:00:00'),
        new Date('2026-03-02T08:00:00'), // 3日は抜け
      ];
      expect(AdherenceStatsEntity.calculateStreak(records, today)).toBe(2);
    });

    it('同日に複数記録があっても1日としてカウント', () => {
      const today = new Date('2026-03-05T10:00:00');
      const records = [
        new Date('2026-03-05T08:00:00'),
        new Date('2026-03-05T12:00:00'),
        new Date('2026-03-05T20:00:00'),
      ];
      expect(AdherenceStatsEntity.calculateStreak(records, today)).toBe(1);
    });
  });

  describe('calculateLongestStreak', () => {
    it('空配列で0を返す', () => {
      expect(AdherenceStatsEntity.calculateLongestStreak([])).toBe(0);
    });

    it('1件のみで1を返す', () => {
      expect(AdherenceStatsEntity.calculateLongestStreak([new Date('2026-03-05')])).toBe(1);
    });

    it('全て連続の場合は総日数を返す', () => {
      const records = [
        new Date('2026-03-01'),
        new Date('2026-03-02'),
        new Date('2026-03-03'),
        new Date('2026-03-04'),
        new Date('2026-03-05'),
      ];
      expect(AdherenceStatsEntity.calculateLongestStreak(records)).toBe(5);
    });

    it('全て飛び飛びの場合は1を返す', () => {
      const records = [
        new Date('2026-03-01'),
        new Date('2026-03-03'),
        new Date('2026-03-05'),
      ];
      expect(AdherenceStatsEntity.calculateLongestStreak(records)).toBe(1);
    });

    it('複数の連続区間がある場合は最長を返す', () => {
      const records = [
        new Date('2026-03-01'),
        new Date('2026-03-02'),
        // gap
        new Date('2026-03-04'),
        new Date('2026-03-05'),
        new Date('2026-03-06'),
      ];
      expect(AdherenceStatsEntity.calculateLongestStreak(records)).toBe(3);
    });
  });

  describe('calculateRate', () => {
    it('期待数0で0を返す', () => {
      expect(AdherenceStatsEntity.calculateRate(5, 0)).toBe(0);
    });

    it('実績が期待を超えても100を返す', () => {
      expect(AdherenceStatsEntity.calculateRate(15, 10)).toBe(100);
    });

    it('半分の場合は50を返す', () => {
      expect(AdherenceStatsEntity.calculateRate(5, 10)).toBe(50);
    });

    it('0の場合は0を返す', () => {
      expect(AdherenceStatsEntity.calculateRate(0, 10)).toBe(0);
    });
  });

  describe('getStreakMessage', () => {
    it('0日は開始メッセージ', () => {
      expect(AdherenceStatsEntity.getStreakMessage(0)).toBe('今日から始めよう');
    });

    it('6日は良いスタート', () => {
      expect(AdherenceStatsEntity.getStreakMessage(6)).toBe('良いスタート');
    });

    it('7日は素晴らしい習慣(境界)', () => {
      expect(AdherenceStatsEntity.getStreakMessage(7)).toBe('素晴らしい習慣');
    });

    it('29日は素晴らしい習慣', () => {
      expect(AdherenceStatsEntity.getStreakMessage(29)).toBe('素晴らしい習慣');
    });

    it('30日は完璧な継続(境界)', () => {
      expect(AdherenceStatsEntity.getStreakMessage(30)).toBe('完璧な継続');
    });
  });
});
