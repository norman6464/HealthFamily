import { describe, it, expect } from 'vitest';
import { Schedule, ScheduleEntity } from '../Schedule';

describe('ScheduleEntity', () => {
  const mockSchedule: Schedule = {
    id: 'schedule-1',
    medicationId: 'med-1',
    userId: 'user-1',
    memberId: 'member-1',
    scheduledTime: '08:00',
    daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'],
    isEnabled: true,
    reminderMinutesBefore: 10,
    createdAt: new Date('2024-01-01'),
  };

  describe('getStatus', () => {
    it('未服薬かつ予定時刻より前の場合、pendingを返す', () => {
      const entity = new ScheduleEntity(mockSchedule);
      const currentTime = new Date('2024-01-01T07:00:00');

      expect(entity.getStatus(currentTime, false)).toBe('pending');
    });

    it('未服薬かつ予定時刻を過ぎた場合、overdueを返す', () => {
      const entity = new ScheduleEntity(mockSchedule);
      const currentTime = new Date('2024-01-01T09:00:00');

      expect(entity.getStatus(currentTime, false)).toBe('overdue');
    });

    it('服薬済みの場合、completedを返す', () => {
      const entity = new ScheduleEntity(mockSchedule);
      const currentTime = new Date('2024-01-01T09:00:00');

      expect(entity.getStatus(currentTime, true)).toBe('completed');
    });

    it('予定時刻ちょうどの場合、pendingを返す', () => {
      const entity = new ScheduleEntity(mockSchedule);
      const currentTime = new Date('2024-01-01T08:00:00');

      expect(entity.getStatus(currentTime, false)).toBe('pending');
    });
  });

  describe('isActiveOnDay', () => {
    it('有効かつ該当曜日の場合、trueを返す', () => {
      const entity = new ScheduleEntity(mockSchedule);
      // 月曜日
      const date = new Date('2024-01-01'); // 2024-01-01は月曜日

      expect(entity.isActiveOnDay(date)).toBe(true);
    });

    it('有効だが該当しない曜日の場合、falseを返す', () => {
      const entity = new ScheduleEntity(mockSchedule);
      // 土曜日
      const date = new Date('2024-01-06');

      expect(entity.isActiveOnDay(date)).toBe(false);
    });

    it('無効な場合、falseを返す', () => {
      const disabledSchedule: Schedule = {
        ...mockSchedule,
        isEnabled: false,
      };
      const entity = new ScheduleEntity(disabledSchedule);
      const date = new Date('2024-01-01'); // 月曜日

      expect(entity.isActiveOnDay(date)).toBe(false);
    });

    it('日曜日が正しく判定される', () => {
      const sundaySchedule: Schedule = {
        ...mockSchedule,
        daysOfWeek: ['sun'],
      };
      const entity = new ScheduleEntity(sundaySchedule);
      const date = new Date('2024-01-07'); // 日曜日

      expect(entity.isActiveOnDay(date)).toBe(true);
    });

    it('全曜日が有効な場合、すべての曜日でtrueを返す', () => {
      const allDaysSchedule: Schedule = {
        ...mockSchedule,
        daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      };
      const entity = new ScheduleEntity(allDaysSchedule);

      // 月〜日まで確認
      for (let i = 1; i <= 7; i++) {
        const date = new Date(`2024-01-0${i}`);
        expect(entity.isActiveOnDay(date)).toBe(true);
      }
    });
  });

  describe('getReminderTime', () => {
    it('リマインダー時刻を正しく計算する', () => {
      const entity = new ScheduleEntity(mockSchedule);
      const date = new Date('2024-01-01T00:00:00');

      const reminderTime = entity.getReminderTime(date);

      // 08:00の10分前 = 07:50
      expect(reminderTime.getHours()).toBe(7);
      expect(reminderTime.getMinutes()).toBe(50);
    });

    it('リマインダー時刻が0分を跨ぐ場合も正しく計算する', () => {
      const earlySchedule: Schedule = {
        ...mockSchedule,
        scheduledTime: '00:05',
        reminderMinutesBefore: 10,
      };
      const entity = new ScheduleEntity(earlySchedule);
      const date = new Date('2024-01-01T00:00:00');

      const reminderTime = entity.getReminderTime(date);

      // 00:05の10分前 = 前日の23:55
      expect(reminderTime.getHours()).toBe(23);
      expect(reminderTime.getMinutes()).toBe(55);
    });

    it('リマインダーなし（0分前）の場合、予定時刻を返す', () => {
      const noReminderSchedule: Schedule = {
        ...mockSchedule,
        reminderMinutesBefore: 0,
      };
      const entity = new ScheduleEntity(noReminderSchedule);
      const date = new Date('2024-01-01T00:00:00');

      const reminderTime = entity.getReminderTime(date);

      expect(reminderTime.getHours()).toBe(8);
      expect(reminderTime.getMinutes()).toBe(0);
    });
  });

  describe('getters', () => {
    it('idを取得できる', () => {
      const entity = new ScheduleEntity(mockSchedule);
      expect(entity.id).toBe('schedule-1');
    });

    it('dataを取得できる', () => {
      const entity = new ScheduleEntity(mockSchedule);
      expect(entity.data).toEqual(mockSchedule);
    });
  });
});
