import { describe, it, expect } from 'vitest';
import { ScheduleEntity, DayOfWeek } from '@/domain/entities/Schedule';

describe('ScheduleEntity 週間完了パターン分析', () => {
  describe('getDayCompletionRates', () => {
    it('空の完了・予定は全曜日0を返す', () => {
      const result = ScheduleEntity.getDayCompletionRates([], []);
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it('予定がない曜日は0を返す', () => {
      const completed: DayOfWeek[] = ['mon'];
      const scheduled: DayOfWeek[] = [];
      const result = ScheduleEntity.getDayCompletionRates(completed, scheduled);
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it('全曜日完了は100を返す', () => {
      const days: DayOfWeek[] = ['mon', 'tue', 'wed'];
      const result = ScheduleEntity.getDayCompletionRates(days, days);
      expect(result[1]).toBe(100); // mon
      expect(result[2]).toBe(100); // tue
      expect(result[3]).toBe(100); // wed
    });

    it('半分完了は50を返す', () => {
      const completed: DayOfWeek[] = ['mon'];
      const scheduled: DayOfWeek[] = ['mon', 'mon'];
      const result = ScheduleEntity.getDayCompletionRates(completed, scheduled);
      expect(result[1]).toBe(50);
    });

    it('複数曜日の混合パターン', () => {
      const completed: DayOfWeek[] = ['mon', 'mon', 'fri'];
      const scheduled: DayOfWeek[] = ['mon', 'mon', 'mon', 'fri', 'fri'];
      const result = ScheduleEntity.getDayCompletionRates(completed, scheduled);
      expect(result[1]).toBe(67); // mon: 2/3
      expect(result[5]).toBe(50); // fri: 1/2
    });
  });

  describe('getWeakestDay', () => {
    it('全て0の場合はnullを返す', () => {
      expect(ScheduleEntity.getWeakestDay([0, 0, 0, 0, 0, 0, 0])).toBeNull();
    });

    it('最も低い曜日のインデックスを返す', () => {
      const rates = [0, 80, 60, 100, 0, 40, 0];
      expect(ScheduleEntity.getWeakestDay(rates)).toBe(5); // fri: 40
    });

    it('0%の曜日は除外する', () => {
      const rates = [0, 50, 0, 100, 0, 0, 0];
      expect(ScheduleEntity.getWeakestDay(rates)).toBe(1); // mon: 50
    });
  });

  describe('getStrongestDay', () => {
    it('全て0の場合はnullを返す', () => {
      expect(ScheduleEntity.getStrongestDay([0, 0, 0, 0, 0, 0, 0])).toBeNull();
    });

    it('最も高い曜日のインデックスを返す', () => {
      const rates = [0, 80, 60, 100, 0, 40, 0];
      expect(ScheduleEntity.getStrongestDay(rates)).toBe(3); // wed: 100
    });

    it('同率の場合は最初の曜日を返す', () => {
      const rates = [0, 50, 50, 0, 0, 0, 0];
      expect(ScheduleEntity.getStrongestDay(rates)).toBe(1);
    });
  });
});
