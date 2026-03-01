import { describe, it, expect } from 'vitest';
import { ScheduleEntity, Schedule } from '@/domain/entities/Schedule';

const createSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'sched-1',
  medicationId: 'med-1',
  userId: 'user-1',
  memberId: 'member-1',
  scheduledTime: '08:00',
  daysOfWeek: ['mon', 'wed', 'fri'],
  isEnabled: true,
  reminderMinutesBefore: 10,
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('ScheduleEntity', () => {
  describe('getStatus', () => {
    it('服薬完了の場合 completed を返す', () => {
      const entity = new ScheduleEntity(createSchedule({ scheduledTime: '08:00' }));
      const now = new Date('2024-06-01T09:00:00');
      expect(entity.getStatus(now, true)).toBe('completed');
    });

    it('予定時刻を過ぎていて未完了の場合 overdue を返す', () => {
      const entity = new ScheduleEntity(createSchedule({ scheduledTime: '08:00' }));
      const now = new Date('2024-06-01T09:00:00');
      expect(entity.getStatus(now, false)).toBe('overdue');
    });

    it('予定時刻前の場合 pending を返す', () => {
      const entity = new ScheduleEntity(createSchedule({ scheduledTime: '14:00' }));
      const now = new Date('2024-06-01T09:00:00');
      expect(entity.getStatus(now, false)).toBe('pending');
    });
  });

  describe('isActiveOnDay', () => {
    it('スケジュールが有効な曜日の場合 true を返す', () => {
      const entity = new ScheduleEntity(createSchedule({ daysOfWeek: ['mon', 'wed', 'fri'] }));
      // 2024-06-03は月曜日
      const monday = new Date('2024-06-03');
      expect(entity.isActiveOnDay(monday)).toBe(true);
    });

    it('スケジュールが無効な曜日の場合 false を返す', () => {
      const entity = new ScheduleEntity(createSchedule({ daysOfWeek: ['mon', 'wed', 'fri'] }));
      // 2024-06-04は火曜日
      const tuesday = new Date('2024-06-04');
      expect(entity.isActiveOnDay(tuesday)).toBe(false);
    });

    it('スケジュールが無効化されている場合 false を返す', () => {
      const entity = new ScheduleEntity(
        createSchedule({ daysOfWeek: ['mon', 'wed', 'fri'], isEnabled: false })
      );
      const monday = new Date('2024-06-03');
      expect(entity.isActiveOnDay(monday)).toBe(false);
    });
  });

  describe('getStatus (境界値)', () => {
    it('予定時刻ちょうどの場合 pending を返す', () => {
      const entity = new ScheduleEntity(createSchedule({ scheduledTime: '08:00' }));
      const now = new Date('2024-06-01T08:00:00');
      expect(entity.getStatus(now, false)).toBe('pending');
    });

    it('完了済みなら時刻に関係なく completed を返す', () => {
      const entity = new ScheduleEntity(createSchedule({ scheduledTime: '14:00' }));
      const now = new Date('2024-06-01T09:00:00');
      expect(entity.getStatus(now, true)).toBe('completed');
    });
  });

  describe('isActiveOnDay (全曜日)', () => {
    it('全曜日が有効な場合、全ての日で true を返す', () => {
      const entity = new ScheduleEntity(
        createSchedule({ daysOfWeek: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] })
      );
      // 2024-06-02(日) ~ 2024-06-08(土)
      for (let i = 2; i <= 8; i++) {
        expect(entity.isActiveOnDay(new Date(`2024-06-0${i}`))).toBe(true);
      }
    });
  });

  describe('getReminderTime', () => {
    it('リマインダー時刻を正しく計算する', () => {
      const entity = new ScheduleEntity(
        createSchedule({ scheduledTime: '08:00', reminderMinutesBefore: 10 })
      );
      const date = new Date('2024-06-01T00:00:00');
      const reminderTime = entity.getReminderTime(date);
      expect(reminderTime.getHours()).toBe(7);
      expect(reminderTime.getMinutes()).toBe(50);
    });

    it('リマインダー0分前の場合、予定時刻と同じを返す', () => {
      const entity = new ScheduleEntity(
        createSchedule({ scheduledTime: '12:30', reminderMinutesBefore: 0 })
      );
      const date = new Date('2024-06-01T00:00:00');
      const reminderTime = entity.getReminderTime(date);
      expect(reminderTime.getHours()).toBe(12);
      expect(reminderTime.getMinutes()).toBe(30);
    });
  });

  describe('id / data', () => {
    it('プロパティにアクセスできる', () => {
      const schedule = createSchedule({ id: 'sched-abc' });
      const entity = new ScheduleEntity(schedule);
      expect(entity.id).toBe('sched-abc');
      expect(entity.data).toBe(schedule);
    });
  });
});
