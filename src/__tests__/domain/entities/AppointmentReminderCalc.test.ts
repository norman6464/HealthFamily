import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity リマインダー日時計算', () => {
  describe('getReminderDate', () => {
    it('予約3日前のリマインダー日を返す', () => {
      const appointmentDate = new Date(2026, 2, 10);
      const result = AppointmentEntity.getReminderDate(appointmentDate, 3);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(2);
      expect(result.getDate()).toBe(7);
    });

    it('予約当日のリマインダーは同日を返す', () => {
      const appointmentDate = new Date(2026, 2, 10);
      const result = AppointmentEntity.getReminderDate(appointmentDate, 0);
      expect(result.getDate()).toBe(10);
    });

    it('1週間前のリマインダーを返す', () => {
      const appointmentDate = new Date(2026, 2, 15);
      const result = AppointmentEntity.getReminderDate(appointmentDate, 7);
      expect(result.getDate()).toBe(8);
    });

    it('月をまたぐリマインダー日を正しく算出する', () => {
      const appointmentDate = new Date(2026, 2, 2);
      const result = AppointmentEntity.getReminderDate(appointmentDate, 5);
      expect(result.getMonth()).toBe(1); // 2月
      expect(result.getDate()).toBe(25);
    });
  });

  describe('formatReminderTiming', () => {
    it('当日は当日を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(0)).toBe('当日');
    });

    it('1日前は前日を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(1)).toBe('前日');
    });

    it('3日前は3日前を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(3)).toBe('3日前');
    });

    it('7日前は1週間前を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(7)).toBe('1週間前');
    });

    it('14日前は2週間前を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(14)).toBe('2週間前');
    });

    it('5日前は5日前を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(5)).toBe('5日前');
    });
  });

  describe('isReminderOverdue', () => {
    it('リマインダー日が過去なら遅延', () => {
      const today = new Date(2026, 2, 10);
      const reminderDate = new Date(2026, 2, 8);
      expect(AppointmentEntity.isReminderOverdue(reminderDate, today)).toBe(true);
    });

    it('リマインダー日が今日なら遅延ではない', () => {
      const today = new Date(2026, 2, 10);
      const reminderDate = new Date(2026, 2, 10);
      expect(AppointmentEntity.isReminderOverdue(reminderDate, today)).toBe(false);
    });

    it('リマインダー日が未来なら遅延ではない', () => {
      const today = new Date(2026, 2, 10);
      const reminderDate = new Date(2026, 2, 12);
      expect(AppointmentEntity.isReminderOverdue(reminderDate, today)).toBe(false);
    });
  });
});
