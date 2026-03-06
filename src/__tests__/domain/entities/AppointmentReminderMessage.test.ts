import { describe, it, expect } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  memberName: '太郎',
  hospitalName: '東京病院',
  appointmentType: 'checkup',
  appointmentDate: new Date('2026-03-10'),
  reminderEnabled: true,
  reminderDaysBefore: 3,
  createdAt: new Date(),
  ...overrides,
});

describe('AppointmentEntity リマインダーメッセージ', () => {
  describe('getReminderMessage', () => {
    it('当日は本日の予約メッセージを返す', () => {
      expect(AppointmentEntity.getReminderMessage(0)).toBe('本日の予約があります');
    });

    it('明日は明日の予約メッセージを返す', () => {
      expect(AppointmentEntity.getReminderMessage(1)).toBe('明日の予約があります');
    });

    it('2日以上は残り日数を含むメッセージを返す', () => {
      expect(AppointmentEntity.getReminderMessage(3)).toBe('3日後に予約があります');
    });

    it('7日はちょうど1週間のメッセージを返す', () => {
      expect(AppointmentEntity.getReminderMessage(7)).toBe('1週間後に予約があります');
    });

    it('負の値は予約日を過ぎたメッセージを返す', () => {
      expect(AppointmentEntity.getReminderMessage(-1)).toBe('予約日を過ぎています');
    });
  });

  describe('formatAppointmentSummary', () => {
    it('全ての情報がある場合のサマリーを返す', () => {
      const apt = createAppointment();
      const result = AppointmentEntity.formatAppointmentSummary(apt);
      expect(result).toContain('太郎');
      expect(result).toContain('東京病院');
      expect(result).toContain('定期検診');
    });

    it('病院名がない場合は省略される', () => {
      const apt = createAppointment({ hospitalName: undefined });
      const result = AppointmentEntity.formatAppointmentSummary(apt);
      expect(result).not.toContain('東京病院');
      expect(result).toContain('太郎');
    });

    it('種別がない場合は省略される', () => {
      const apt = createAppointment({ appointmentType: undefined });
      const result = AppointmentEntity.formatAppointmentSummary(apt);
      expect(result).not.toContain('定期検診');
    });
  });

  describe('getUpcomingAppointments', () => {
    it('空配列は空配列を返す', () => {
      const result = AppointmentEntity.getUpcomingAppointments([], new Date('2026-03-05'), 7);
      expect(result).toEqual([]);
    });

    it('指定日数以内の予約のみ返す', () => {
      const today = new Date('2026-03-05');
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-06') }),
        createAppointment({ appointmentDate: new Date('2026-03-10') }),
        createAppointment({ appointmentDate: new Date('2026-03-20') }),
      ];
      const result = AppointmentEntity.getUpcomingAppointments(appointments, today, 7);
      expect(result).toHaveLength(2);
    });

    it('過去の予約は含めない', () => {
      const today = new Date('2026-03-05');
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-01') }),
        createAppointment({ appointmentDate: new Date('2026-03-06') }),
      ];
      const result = AppointmentEntity.getUpcomingAppointments(appointments, today, 7);
      expect(result).toHaveLength(1);
    });

    it('当日の予約は含む', () => {
      const today = new Date('2026-03-05');
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-05') }),
      ];
      const result = AppointmentEntity.getUpcomingAppointments(appointments, today, 7);
      expect(result).toHaveLength(1);
    });

    it('日付順にソートされる', () => {
      const today = new Date('2026-03-05');
      const appointments = [
        createAppointment({ id: 'apt-2', appointmentDate: new Date('2026-03-10') }),
        createAppointment({ id: 'apt-1', appointmentDate: new Date('2026-03-06') }),
      ];
      const result = AppointmentEntity.getUpcomingAppointments(appointments, today, 7);
      expect(result[0].id).toBe('apt-1');
      expect(result[1].id).toBe('apt-2');
    });
  });
});
