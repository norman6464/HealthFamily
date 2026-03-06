import { describe, it, expect } from 'vitest';
import { CalendarEntity, CalendarDay } from '@/domain/entities/Calendar';

const makeDay = (recordCount: number, isCurrentMonth: boolean = true): CalendarDay => ({
  date: new Date(2026, 2, 1),
  isCurrentMonth,
  isToday: false,
  recordCount,
  averageCondition: recordCount > 0 ? 4 : null,
});

describe('CalendarEntity 月間統計サマリー', () => {
  describe('getMonthlyStats', () => {
    it('月間の統計を正しく集計する', () => {
      const days = [makeDay(3), makeDay(0), makeDay(2), makeDay(1)];
      const stats = CalendarEntity.getMonthlyStats(days);
      expect(stats.totalRecords).toBe(6);
      expect(stats.recordDays).toBe(3);
      expect(stats.totalDays).toBe(4);
      expect(stats.maxRecordsInDay).toBe(3);
    });

    it('空の日配列の場合', () => {
      const stats = CalendarEntity.getMonthlyStats([]);
      expect(stats.totalRecords).toBe(0);
      expect(stats.recordDays).toBe(0);
      expect(stats.totalDays).toBe(0);
      expect(stats.maxRecordsInDay).toBe(0);
    });

    it('当月の日のみを対象にする', () => {
      const days = [makeDay(3, true), makeDay(2, false), makeDay(1, true)];
      const stats = CalendarEntity.getMonthlyStats(days);
      expect(stats.totalDays).toBe(2);
      expect(stats.totalRecords).toBe(4);
    });
  });

  describe('getStreakDays', () => {
    it('連続記録日数を算出する', () => {
      const counts = [1, 2, 3, 0, 1, 1];
      expect(CalendarEntity.getStreakDays(counts)).toBe(3);
    });

    it('全て記録ありなら配列長を返す', () => {
      expect(CalendarEntity.getStreakDays([1, 1, 1, 1])).toBe(4);
    });

    it('全て記録なしなら0を返す', () => {
      expect(CalendarEntity.getStreakDays([0, 0, 0])).toBe(0);
    });

    it('空配列なら0を返す', () => {
      expect(CalendarEntity.getStreakDays([])).toBe(0);
    });

    it('末尾の連続が最長の場合', () => {
      expect(CalendarEntity.getStreakDays([0, 1, 1, 1, 1])).toBe(4);
    });
  });

  describe('getMonthlyStatsMessage', () => {
    it('記録率80%以上は優秀メッセージ', () => {
      const msg = CalendarEntity.getMonthlyStatsMessage(25, 30);
      expect(msg).toContain('素晴らしい');
    });

    it('記録率50%以上は良好メッセージ', () => {
      const msg = CalendarEntity.getMonthlyStatsMessage(16, 30);
      expect(msg).toContain('順調');
    });

    it('記録率50%未満は促進メッセージ', () => {
      const msg = CalendarEntity.getMonthlyStatsMessage(5, 30);
      expect(msg).toContain('記録');
    });

    it('記録0件は開始メッセージ', () => {
      const msg = CalendarEntity.getMonthlyStatsMessage(0, 30);
      expect(msg).toContain('始め');
    });
  });
});
