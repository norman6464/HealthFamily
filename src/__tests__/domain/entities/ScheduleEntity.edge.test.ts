import { describe, it, expect } from 'vitest';
import { ScheduleEntity, Schedule, DayOfWeek } from '@/domain/entities/Schedule';

const createSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sched-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'member-1',
  scheduledTime: '08:00',
  daysOfWeek: [] as readonly DayOfWeek[],
  isEnabled: true,
  reminderMinutesBefore: 10,
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

describe('ScheduleEntity - エッジケース', () => {
  describe('getStatus - 境界値', () => {
    it('予定時刻ちょうどの場合はpendingを返す', () => {
      const schedule = createSchedule({ scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule);
      const exactTime = new Date('2026-03-05T08:00:00');
      expect(entity.getStatus(exactTime, false)).toBe('pending');
    });

    it('予定時刻の1秒後はoverdueを返す', () => {
      const schedule = createSchedule({ scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule);
      const afterTime = new Date('2026-03-05T08:00:01');
      expect(entity.getStatus(afterTime, false)).toBe('overdue');
    });

    it('completedフラグが優先される', () => {
      const schedule = createSchedule({ scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule);
      const afterTime = new Date('2026-03-05T10:00:00');
      expect(entity.getStatus(afterTime, true)).toBe('completed');
    });

    it('深夜0時のスケジュールを正しく判定する', () => {
      const schedule = createSchedule({ scheduledTime: '00:00' });
      const entity = new ScheduleEntity(schedule);
      const beforeMidnight = new Date('2026-03-05T23:59:59');
      // 23:59:59 > 00:00:00 (同日) なのでoverdue
      expect(entity.getStatus(beforeMidnight, false)).toBe('overdue');
    });
  });

  describe('isActiveOnDay - 境界値', () => {
    it('無効なスケジュールは常にfalseを返す', () => {
      const schedule = createSchedule({ isEnabled: false });
      const entity = new ScheduleEntity(schedule);
      expect(entity.isActiveOnDay(new Date('2026-03-05'))).toBe(false);
    });

    it('曜日未設定（毎日）で有効なスケジュールはtrueを返す', () => {
      const schedule = createSchedule({ daysOfWeek: [], isEnabled: true });
      const entity = new ScheduleEntity(schedule);
      // 全曜日でtrue
      for (let i = 0; i < 7; i++) {
        const date = new Date(2026, 2, 1 + i); // 2026-03-01(日)から
        expect(entity.isActiveOnDay(date)).toBe(true);
      }
    });

    it('月曜のみ設定で月曜日はtrue、火曜はfalseを返す', () => {
      const schedule = createSchedule({ daysOfWeek: ['mon'] });
      const entity = new ScheduleEntity(schedule);
      const monday = new Date('2026-03-02'); // 月曜
      const tuesday = new Date('2026-03-03'); // 火曜
      expect(entity.isActiveOnDay(monday)).toBe(true);
      expect(entity.isActiveOnDay(tuesday)).toBe(false);
    });
  });

  describe('hasOverlap - 境界値', () => {
    it('異なる薬では重複しない', () => {
      const schedule1 = createSchedule({ medicationId: 'med-1', scheduledTime: '08:00' });
      const schedule2 = createSchedule({ medicationId: 'med-2', scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule1);
      expect(entity.hasOverlap(schedule2)).toBe(false);
    });

    it('同じ薬で時刻が1分違えば重複しない', () => {
      const schedule1 = createSchedule({ scheduledTime: '08:00' });
      const schedule2 = createSchedule({ scheduledTime: '08:01' });
      const entity = new ScheduleEntity(schedule1);
      expect(entity.hasOverlap(schedule2)).toBe(false);
    });

    it('同じ薬・時刻で片方が毎日なら重複する', () => {
      const schedule1 = createSchedule({ scheduledTime: '08:00', daysOfWeek: [] });
      const schedule2 = createSchedule({ scheduledTime: '08:00', daysOfWeek: ['mon'] });
      const entity = new ScheduleEntity(schedule1);
      expect(entity.hasOverlap(schedule2)).toBe(true);
    });

    it('同じ薬・時刻で曜日が重ならなければ重複しない', () => {
      const schedule1 = createSchedule({ scheduledTime: '08:00', daysOfWeek: ['mon', 'wed'] });
      const schedule2 = createSchedule({ scheduledTime: '08:00', daysOfWeek: ['tue', 'thu'] });
      const entity = new ScheduleEntity(schedule1);
      expect(entity.hasOverlap(schedule2)).toBe(false);
    });
  });

  describe('getReminderTime', () => {
    it('リマインダー時刻を正しく算出する', () => {
      const schedule = createSchedule({ scheduledTime: '08:00', reminderMinutesBefore: 30 });
      const entity = new ScheduleEntity(schedule);
      const result = entity.getReminderTime(new Date('2026-03-05'));
      expect(result.getHours()).toBe(7);
      expect(result.getMinutes()).toBe(30);
    });

    it('リマインダー0分の場合は予定時刻と同じになる', () => {
      const schedule = createSchedule({ scheduledTime: '08:00', reminderMinutesBefore: 0 });
      const entity = new ScheduleEntity(schedule);
      const result = entity.getReminderTime(new Date('2026-03-05'));
      expect(result.getHours()).toBe(8);
      expect(result.getMinutes()).toBe(0);
    });

    it('深夜跨ぎのリマインダーを正しく処理する', () => {
      const schedule = createSchedule({ scheduledTime: '00:15', reminderMinutesBefore: 30 });
      const entity = new ScheduleEntity(schedule);
      const result = entity.getReminderTime(new Date('2026-03-05'));
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(45);
      expect(result.getDate()).toBe(4); // 前日
    });
  });

  describe('getOverdueLevel - 境界値', () => {
    it('29分はnoneを返す', () => {
      const schedule = createSchedule({ scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule);
      const time = new Date('2026-03-05T08:29:59');
      expect(entity.getOverdueLevel(time, false)).toBe('none');
    });

    it('30分はwarningを返す', () => {
      const schedule = createSchedule({ scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule);
      const time = new Date('2026-03-05T08:30:00');
      expect(entity.getOverdueLevel(time, false)).toBe('warning');
    });

    it('59分はwarningを返す', () => {
      const schedule = createSchedule({ scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule);
      const time = new Date('2026-03-05T08:59:59');
      expect(entity.getOverdueLevel(time, false)).toBe('warning');
    });

    it('60分はdangerを返す', () => {
      const schedule = createSchedule({ scheduledTime: '08:00' });
      const entity = new ScheduleEntity(schedule);
      const time = new Date('2026-03-05T09:00:00');
      expect(entity.getOverdueLevel(time, false)).toBe('danger');
    });
  });
});
