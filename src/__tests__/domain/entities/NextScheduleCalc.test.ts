import { describe, it, expect } from 'vitest';
import { ScheduleEntity, DayOfWeek } from '@/domain/entities/Schedule';

describe('ScheduleEntity 次回スケジュール算出', () => {
  describe('getNextScheduledDay', () => {
    it('今日が月曜で月水金が対象なら水曜を返す', () => {
      // 2026-03-02 は月曜日
      const today = new Date(2026, 2, 2);
      const days: DayOfWeek[] = ['mon', 'wed', 'fri'];
      expect(ScheduleEntity.getNextScheduledDay(today, days)).toBe('wed');
    });

    it('今日が金曜で月水金が対象なら月曜を返す', () => {
      // 2026-03-06 は金曜日
      const today = new Date(2026, 2, 6);
      const days: DayOfWeek[] = ['mon', 'wed', 'fri'];
      expect(ScheduleEntity.getNextScheduledDay(today, days)).toBe('mon');
    });

    it('今日が土曜で日曜のみ対象なら日曜を返す', () => {
      // 2026-03-07 は土曜日
      const today = new Date(2026, 2, 7);
      const days: DayOfWeek[] = ['sun'];
      expect(ScheduleEntity.getNextScheduledDay(today, days)).toBe('sun');
    });

    it('空配列（毎日）なら翌日の曜日を返す', () => {
      // 2026-03-04 は水曜日 → 翌日は木曜
      const today = new Date(2026, 2, 4);
      expect(ScheduleEntity.getNextScheduledDay(today, [])).toBe('thu');
    });

    it('今日が日曜で土曜のみ対象なら土曜を返す', () => {
      // 2026-03-01 は日曜日
      const today = new Date(2026, 2, 1);
      const days: DayOfWeek[] = ['sat'];
      expect(ScheduleEntity.getNextScheduledDay(today, days)).toBe('sat');
    });
  });

  describe('getNextScheduledDateTime', () => {
    it('次回のスケジュール日時を返す', () => {
      // 2026-03-02 月曜 → 次は水曜 03-04
      const today = new Date(2026, 2, 2);
      const days: DayOfWeek[] = ['mon', 'wed', 'fri'];
      const result = ScheduleEntity.getNextScheduledDateTime(today, '08:30', days);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2);
      expect(result.getDate()).toBe(4);
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(30);
    });

    it('空配列（毎日）なら翌日の時刻を返す', () => {
      const today = new Date(2026, 2, 5);
      const result = ScheduleEntity.getNextScheduledDateTime(today, '12:00', []);
      expect(result.getDate()).toBe(6);
      expect(result.getHours()).toBe(12);
    });

    it('週末まで飛ぶ場合に正しい日時を返す', () => {
      // 2026-03-05 木曜 → 次の土曜は 03-07
      const today = new Date(2026, 2, 5);
      const days: DayOfWeek[] = ['sat'];
      const result = ScheduleEntity.getNextScheduledDateTime(today, '09:00', days);
      expect(result.getDate()).toBe(7);
    });
  });

  describe('getDaysUntilNextSchedule', () => {
    it('2日後のスケジュールなら2を返す', () => {
      // 月曜 → 水曜 = 2日後
      const today = new Date(2026, 2, 2);
      const days: DayOfWeek[] = ['mon', 'wed', 'fri'];
      expect(ScheduleEntity.getDaysUntilNextSchedule(today, days)).toBe(2);
    });

    it('翌日のスケジュールなら1を返す', () => {
      // 空配列（毎日）→ 常に1
      const today = new Date(2026, 2, 3);
      expect(ScheduleEntity.getDaysUntilNextSchedule(today, [])).toBe(1);
    });

    it('6日後のスケジュールなら6を返す', () => {
      // 日曜(2026-03-01) → 土曜 = 6日後
      const today = new Date(2026, 2, 1);
      const days: DayOfWeek[] = ['sat'];
      expect(ScheduleEntity.getDaysUntilNextSchedule(today, days)).toBe(6);
    });

    it('翌日が対象曜日なら1を返す', () => {
      // 土曜(2026-03-07) → 日曜 = 1日後
      const today = new Date(2026, 2, 7);
      const days: DayOfWeek[] = ['sun'];
      expect(ScheduleEntity.getDaysUntilNextSchedule(today, days)).toBe(1);
    });
  });
});
