import { describe, it, expect } from 'vitest';
import { CalendarEntity, CalendarDay } from '@/domain/entities/Calendar';

const makeDay = (recordCount: number, isCurrentMonth: boolean = true): CalendarDay => ({
  date: new Date(2026, 2, 1),
  isCurrentMonth,
  isToday: false,
  recordCount,
  averageCondition: null,
});

describe('CalendarMonthlyStats エッジケース', () => {
  describe('getMonthlyStats', () => {
    it('全て前月の日の場合は0を返す', () => {
      const days = [makeDay(3, false), makeDay(2, false)];
      const stats = CalendarEntity.getMonthlyStats(days);
      expect(stats.totalDays).toBe(0);
      expect(stats.totalRecords).toBe(0);
    });

    it('全て記録0の場合', () => {
      const days = [makeDay(0), makeDay(0), makeDay(0)];
      const stats = CalendarEntity.getMonthlyStats(days);
      expect(stats.recordDays).toBe(0);
      expect(stats.maxRecordsInDay).toBe(0);
    });
  });

  describe('getStreakDays', () => {
    it('1要素で記録ありなら1を返す', () => {
      expect(CalendarEntity.getStreakDays([1])).toBe(1);
    });

    it('交互の場合は1を返す', () => {
      expect(CalendarEntity.getStreakDays([1, 0, 1, 0, 1])).toBe(1);
    });

    it('最後に連続がある場合', () => {
      expect(CalendarEntity.getStreakDays([0, 0, 1, 1])).toBe(2);
    });
  });

  describe('getMonthlyStatsMessage', () => {
    it('1日/1日は素晴らしいメッセージ', () => {
      const msg = CalendarEntity.getMonthlyStatsMessage(1, 1);
      expect(msg).toContain('素晴らしい');
    });

    it('totalDays 0でrecordDays 0の場合', () => {
      const msg = CalendarEntity.getMonthlyStatsMessage(0, 0);
      expect(msg).toContain('始め');
    });
  });
});
