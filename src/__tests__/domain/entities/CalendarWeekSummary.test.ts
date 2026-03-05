import { describe, it, expect } from 'vitest';
import { CalendarEntity, CalendarDay } from '@/domain/entities/Calendar';

const createDay = (overrides: Partial<CalendarDay> = {}): CalendarDay => ({
  date: new Date('2026-03-05'),
  isCurrentMonth: true,
  isToday: false,
  recordCount: 0,
  averageCondition: null,
  ...overrides,
});

describe('CalendarEntity 週間サマリー', () => {
  describe('getWeekSummary', () => {
    it('空配列は記録数0・平均nullを返す', () => {
      const result = CalendarEntity.getWeekSummary([]);
      expect(result.totalRecords).toBe(0);
      expect(result.averageCondition).toBeNull();
    });

    it('全日に記録がある場合の集計', () => {
      const days = [
        createDay({ recordCount: 2, averageCondition: 4 }),
        createDay({ recordCount: 1, averageCondition: 3 }),
        createDay({ recordCount: 3, averageCondition: 5 }),
      ];
      const result = CalendarEntity.getWeekSummary(days);
      expect(result.totalRecords).toBe(6);
      expect(result.averageCondition).toBe(4);
    });

    it('一部の日に記録がない場合はnull以外の日で平均を計算', () => {
      const days = [
        createDay({ recordCount: 2, averageCondition: 4 }),
        createDay({ recordCount: 0, averageCondition: null }),
        createDay({ recordCount: 1, averageCondition: 2 }),
      ];
      const result = CalendarEntity.getWeekSummary(days);
      expect(result.totalRecords).toBe(3);
      expect(result.averageCondition).toBe(3);
    });

    it('全日記録なしの場合は平均null', () => {
      const days = [
        createDay({ recordCount: 0, averageCondition: null }),
        createDay({ recordCount: 0, averageCondition: null }),
      ];
      const result = CalendarEntity.getWeekSummary(days);
      expect(result.totalRecords).toBe(0);
      expect(result.averageCondition).toBeNull();
    });

    it('記録がある日数を正しくカウントする', () => {
      const days = [
        createDay({ recordCount: 2 }),
        createDay({ recordCount: 0 }),
        createDay({ recordCount: 1 }),
        createDay({ recordCount: 0 }),
        createDay({ recordCount: 3 }),
      ];
      const result = CalendarEntity.getWeekSummary(days);
      expect(result.daysWithRecords).toBe(3);
    });
  });

  describe('getWeekCompletionStatus', () => {
    it('全日に記録があればcompleteを返す', () => {
      const days = [
        createDay({ recordCount: 1 }),
        createDay({ recordCount: 2 }),
        createDay({ recordCount: 1 }),
      ];
      expect(CalendarEntity.getWeekCompletionStatus(days)).toBe('complete');
    });

    it('一部の日に記録があればpartialを返す', () => {
      const days = [
        createDay({ recordCount: 1 }),
        createDay({ recordCount: 0 }),
        createDay({ recordCount: 1 }),
      ];
      expect(CalendarEntity.getWeekCompletionStatus(days)).toBe('partial');
    });

    it('全日記録なしはemptyを返す', () => {
      const days = [
        createDay({ recordCount: 0 }),
        createDay({ recordCount: 0 }),
      ];
      expect(CalendarEntity.getWeekCompletionStatus(days)).toBe('empty');
    });

    it('空配列はemptyを返す', () => {
      expect(CalendarEntity.getWeekCompletionStatus([])).toBe('empty');
    });
  });

  describe('getBusiestDay', () => {
    it('空配列はnullを返す', () => {
      expect(CalendarEntity.getBusiestDay([])).toBeNull();
    });

    it('最も記録が多い日を返す', () => {
      const days = [
        createDay({ date: new Date('2026-03-02'), recordCount: 2 }),
        createDay({ date: new Date('2026-03-03'), recordCount: 5 }),
        createDay({ date: new Date('2026-03-04'), recordCount: 1 }),
      ];
      const result = CalendarEntity.getBusiestDay(days);
      expect(result!.recordCount).toBe(5);
    });

    it('全て0件の場合はnullを返す', () => {
      const days = [
        createDay({ recordCount: 0 }),
        createDay({ recordCount: 0 }),
      ];
      expect(CalendarEntity.getBusiestDay(days)).toBeNull();
    });

    it('同数の場合は最初の日を返す', () => {
      const days = [
        createDay({ date: new Date('2026-03-02'), recordCount: 3 }),
        createDay({ date: new Date('2026-03-03'), recordCount: 3 }),
      ];
      const result = CalendarEntity.getBusiestDay(days);
      expect(result!.date.getDate()).toBe(2);
    });
  });
});
