import { describe, it, expect } from 'vitest';
import { ScheduleEntity, DayOfWeek } from '@/domain/entities/Schedule';

describe('NextScheduleCalc エッジケース', () => {
  describe('getNextScheduledDay', () => {
    it('今日と同じ曜日のみ対象なら翌週の同じ曜日を返す', () => {
      // 2026-03-02 月曜 → 月曜のみ → 翌週月曜
      const today = new Date(2026, 2, 2);
      const days: DayOfWeek[] = ['mon'];
      expect(ScheduleEntity.getNextScheduledDay(today, days)).toBe('mon');
    });

    it('年またぎでも正しく動作する', () => {
      // 2025-12-31 水曜 → 木曜のみ → 2026-01-01 木曜
      const today = new Date(2025, 11, 31);
      const days: DayOfWeek[] = ['thu'];
      expect(ScheduleEntity.getNextScheduledDay(today, days)).toBe('thu');
    });

    it('月またぎでも正しく動作する', () => {
      // 2026-02-28 土曜 → 日曜 → 2026-03-01
      const today = new Date(2026, 1, 28);
      const days: DayOfWeek[] = ['sun'];
      expect(ScheduleEntity.getNextScheduledDay(today, days)).toBe('sun');
    });
  });

  describe('getNextScheduledDateTime', () => {
    it('年またぎで正しい日時を返す', () => {
      const today = new Date(2025, 11, 31);
      const result = ScheduleEntity.getNextScheduledDateTime(today, '10:00', []);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0);
      expect(result.getDate()).toBe(1);
    });

    it('深夜の時刻でも正しく設定される', () => {
      const today = new Date(2026, 2, 5);
      const result = ScheduleEntity.getNextScheduledDateTime(today, '23:59', []);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });
  });

  describe('getDaysUntilNextSchedule', () => {
    it('全曜日指定なら常に1', () => {
      const today = new Date(2026, 2, 5);
      const allDays: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      expect(ScheduleEntity.getDaysUntilNextSchedule(today, allDays)).toBe(1);
    });

    it('翌日のみ対象なら1を返す', () => {
      // 2026-03-05 木曜 → 金曜のみ
      const today = new Date(2026, 2, 5);
      const days: DayOfWeek[] = ['fri'];
      expect(ScheduleEntity.getDaysUntilNextSchedule(today, days)).toBe(1);
    });
  });
});
