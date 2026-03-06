import { describe, it, expect } from 'vitest';
import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentReminderCalc エッジケース', () => {
  describe('getReminderDate', () => {
    it('年またぎのリマインダー日を正しく算出する', () => {
      const appointmentDate = new Date(2026, 0, 2); // 1月2日
      const result = AppointmentEntity.getReminderDate(appointmentDate, 5);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // 12月
      expect(result.getDate()).toBe(28);
    });

    it('30日前のリマインダーを正しく算出する', () => {
      const appointmentDate = new Date(2026, 2, 15);
      const result = AppointmentEntity.getReminderDate(appointmentDate, 30);
      expect(result.getMonth()).toBe(1); // 2月
      expect(result.getDate()).toBe(13);
    });
  });

  describe('formatReminderTiming', () => {
    it('21日前は3週間前を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(21)).toBe('3週間前');
    });

    it('10日前は10日前を返す', () => {
      expect(AppointmentEntity.formatReminderTiming(10)).toBe('10日前');
    });
  });

  describe('isReminderOverdue', () => {
    it('1ヶ月前のリマインダーは遅延', () => {
      const today = new Date(2026, 2, 10);
      const reminderDate = new Date(2026, 1, 10);
      expect(AppointmentEntity.isReminderOverdue(reminderDate, today)).toBe(true);
    });

    it('同日の異なる時刻は遅延ではない', () => {
      const today = new Date(2026, 2, 10, 15, 0);
      const reminderDate = new Date(2026, 2, 10, 8, 0);
      expect(AppointmentEntity.isReminderOverdue(reminderDate, today)).toBe(false);
    });
  });
});
