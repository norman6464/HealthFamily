import { describe, it, expect } from 'vitest';
import { CalendarEntity, CalendarDay } from '@/domain/entities/Calendar';

const createDay = (date: string, recordCount: number = 0): CalendarDay => ({
  date: new Date(date),
  isCurrentMonth: true,
  isToday: false,
  recordCount,
});

describe('CalendarEntity 月間統計', () => {
  describe('getMonthlyRecordRate', () => {
    it('空配列は0を返す', () => {
      expect(CalendarEntity.getMonthlyRecordRate([])).toBe(0);
    });

    it('全日記録ありの場合は100を返す', () => {
      const days = [
        createDay('2026-03-01', 1),
        createDay('2026-03-02', 2),
        createDay('2026-03-03', 1),
      ];
      expect(CalendarEntity.getMonthlyRecordRate(days)).toBe(100);
    });

    it('半分記録ありの場合は50を返す', () => {
      const days = [
        createDay('2026-03-01', 1),
        createDay('2026-03-02', 0),
      ];
      expect(CalendarEntity.getMonthlyRecordRate(days)).toBe(50);
    });

    it('記録なしの場合は0を返す', () => {
      const days = [
        createDay('2026-03-01', 0),
        createDay('2026-03-02', 0),
      ];
      expect(CalendarEntity.getMonthlyRecordRate(days)).toBe(0);
    });

    it('当月以外の日は除外する', () => {
      const days = [
        createDay('2026-03-01', 1),
        { ...createDay('2026-02-28', 1), isCurrentMonth: false },
      ];
      expect(CalendarEntity.getMonthlyRecordRate(days)).toBe(100);
    });
  });

  describe('getActiveWeeks', () => {
    it('空配列は0を返す', () => {
      expect(CalendarEntity.getActiveWeeks([])).toBe(0);
    });

    it('1週間に記録ありの場合は1を返す', () => {
      const days = [
        createDay('2026-03-02', 1), // 月
        createDay('2026-03-03', 0), // 火
      ];
      expect(CalendarEntity.getActiveWeeks(days)).toBe(1);
    });

    it('異なる週に記録がある場合は週数を返す', () => {
      const days = [
        createDay('2026-03-02', 1), // 第1週月
        createDay('2026-03-09', 1), // 第2週月
      ];
      expect(CalendarEntity.getActiveWeeks(days)).toBe(2);
    });

    it('記録なしの日のみの場合は0を返す', () => {
      const days = [
        createDay('2026-03-01', 0),
        createDay('2026-03-02', 0),
      ];
      expect(CalendarEntity.getActiveWeeks(days)).toBe(0);
    });
  });
});
