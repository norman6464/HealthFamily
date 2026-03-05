import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper', () => {
  describe('daysAgo', () => {
    it('指定日数前の日付を0時で返す', () => {
      const now = new Date('2026-03-05T15:30:00');
      const result = DateRangeHelper.daysAgo(7, now);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // Feb
      expect(result.getDate()).toBe(26);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
    });

    it('0日前は当日の0時を返す', () => {
      const now = new Date('2026-03-05T15:30:00');
      const result = DateRangeHelper.daysAgo(0, now);
      expect(result.getDate()).toBe(5);
      expect(result.getHours()).toBe(0);
    });

    it('30日前を正しく算出する', () => {
      const now = new Date('2026-03-05T10:00:00');
      const result = DateRangeHelper.daysAgo(30, now);
      expect(result.getMonth()).toBe(1); // Feb
      expect(result.getDate()).toBe(3);
    });
  });

  describe('calculateExpectedByDayOfWeek', () => {
    it('毎日のスケジュールは全曜日に加算する', () => {
      const schedules = [{ daysOfWeek: [] as string[] }];
      const result = DateRangeHelper.calculateExpectedByDayOfWeek(schedules);
      expect(result).toEqual([1, 1, 1, 1, 1, 1, 1]);
    });

    it('特定曜日のスケジュールは該当曜日のみ加算する', () => {
      const schedules = [{ daysOfWeek: ['mon', 'wed', 'fri'] }];
      const result = DateRangeHelper.calculateExpectedByDayOfWeek(schedules);
      expect(result).toEqual([0, 1, 0, 1, 0, 1, 0]);
    });

    it('複数スケジュールを合算する', () => {
      const schedules = [
        { daysOfWeek: ['mon'] },
        { daysOfWeek: [] as string[] },
      ];
      const result = DateRangeHelper.calculateExpectedByDayOfWeek(schedules);
      expect(result).toEqual([1, 2, 1, 1, 1, 1, 1]);
    });

    it('空のスケジュールは全て0を返す', () => {
      const result = DateRangeHelper.calculateExpectedByDayOfWeek([]);
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });
  });
});
