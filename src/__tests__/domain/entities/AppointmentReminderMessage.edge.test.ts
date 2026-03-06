import { describe, it, expect } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date('2026-03-10'),
  reminderEnabled: true,
  reminderDaysBefore: 3,
  createdAt: new Date(),
  ...overrides,
});

describe('AppointmentEntity リマインダーメッセージ エッジケース', () => {
  describe('getReminderMessage', () => {
    it('14日は日数メッセージを返す', () => {
      expect(AppointmentEntity.getReminderMessage(14)).toBe('14日後に予約があります');
    });

    it('大きな負の値は過ぎたメッセージを返す', () => {
      expect(AppointmentEntity.getReminderMessage(-30)).toBe('予約日を過ぎています');
    });
  });

  describe('formatAppointmentSummary', () => {
    it('全情報なしの場合は空文字を返す', () => {
      const apt = createAppointment({ memberName: undefined, hospitalName: undefined, appointmentType: undefined });
      expect(AppointmentEntity.formatAppointmentSummary(apt)).toBe('');
    });

    it('メンバー名のみの場合はメンバー名を返す', () => {
      const apt = createAppointment({ memberName: '花子', hospitalName: undefined, appointmentType: undefined });
      expect(AppointmentEntity.formatAppointmentSummary(apt)).toBe('花子');
    });

    it('未知の種別はそのまま表示する', () => {
      const apt = createAppointment({ appointmentType: 'custom_type' });
      const result = AppointmentEntity.formatAppointmentSummary(apt);
      expect(result).toContain('custom_type');
    });
  });

  describe('getUpcomingAppointments', () => {
    it('withinDays=0は当日のみ返す', () => {
      const today = new Date('2026-03-05');
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-05') }),
        createAppointment({ appointmentDate: new Date('2026-03-06') }),
      ];
      const result = AppointmentEntity.getUpcomingAppointments(appointments, today, 0);
      expect(result).toHaveLength(1);
    });

    it('ちょうどwithinDays日後の予約は含む', () => {
      const today = new Date('2026-03-01');
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-08') }),
      ];
      const result = AppointmentEntity.getUpcomingAppointments(appointments, today, 7);
      expect(result).toHaveLength(1);
    });
  });
});
