import { describe, it, expect } from 'vitest';
import { ScheduleEntity, DayOfWeek } from '@/domain/entities/Schedule';

describe('ScheduleEntity 週間完了パターン エッジケース', () => {
  describe('getDayCompletionRates エッジケース', () => {
    it('全曜日に予定がある場合', () => {
      const all: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      const result = ScheduleEntity.getDayCompletionRates(all, all);
      expect(result.every((r) => r === 100)).toBe(true);
    });

    it('完了が予定より多くても100%を超える', () => {
      const completed: DayOfWeek[] = ['mon', 'mon', 'mon'];
      const scheduled: DayOfWeek[] = ['mon', 'mon'];
      const result = ScheduleEntity.getDayCompletionRates(completed, scheduled);
      expect(result[1]).toBe(150);
    });

    it('週末のみの予定', () => {
      const completed: DayOfWeek[] = ['sat'];
      const scheduled: DayOfWeek[] = ['sat', 'sun'];
      const result = ScheduleEntity.getDayCompletionRates(completed, scheduled);
      expect(result[0]).toBe(0); // sun
      expect(result[6]).toBe(100); // sat
    });
  });

  describe('getWeakestDay エッジケース', () => {
    it('全曜日100%の場合は日曜を返す', () => {
      const rates = [100, 100, 100, 100, 100, 100, 100];
      expect(ScheduleEntity.getWeakestDay(rates)).toBe(0);
    });

    it('1曜日のみ記録がある場合はその曜日を返す', () => {
      const rates = [0, 0, 0, 50, 0, 0, 0];
      expect(ScheduleEntity.getWeakestDay(rates)).toBe(3);
    });
  });

  describe('getStrongestDay エッジケース', () => {
    it('全曜日100%の場合は日曜を返す', () => {
      const rates = [100, 100, 100, 100, 100, 100, 100];
      expect(ScheduleEntity.getStrongestDay(rates)).toBe(0);
    });
  });
});
