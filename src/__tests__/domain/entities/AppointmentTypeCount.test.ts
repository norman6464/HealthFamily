import { describe, it, expect } from 'vitest';
import { Appointment, AppointmentEntity } from '@/domain/entities/Appointment';

const makeAppointment = (overrides: Partial<Appointment>): Appointment => ({
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date('2026-03-10'),
  reminderEnabled: false,
  reminderDaysBefore: 0,
  createdAt: new Date(),
  ...overrides,
});

describe('AppointmentEntity 種別集計', () => {
  describe('countByType', () => {
    it('空配列で空オブジェクトを返す', () => {
      expect(AppointmentEntity.countByType([])).toEqual({});
    });

    it('種別ごとの件数をカウントする', () => {
      const appointments = [
        makeAppointment({ id: '1', appointmentType: 'checkup' }),
        makeAppointment({ id: '2', appointmentType: 'checkup' }),
        makeAppointment({ id: '3', appointmentType: 'treatment' }),
      ];
      const result = AppointmentEntity.countByType(appointments);
      expect(result).toEqual({ checkup: 2, treatment: 1 });
    });

    it('種別がundefinedの予約はotherとしてカウントする', () => {
      const appointments = [
        makeAppointment({ id: '1' }),
        makeAppointment({ id: '2', appointmentType: 'checkup' }),
      ];
      const result = AppointmentEntity.countByType(appointments);
      expect(result).toEqual({ other: 1, checkup: 1 });
    });
  });

  describe('getUpcomingCount', () => {
    it('空配列で0を返す', () => {
      expect(AppointmentEntity.getUpcomingCount([], new Date('2026-03-05'))).toBe(0);
    });

    it('未来の予約のみカウントする', () => {
      const appointments = [
        makeAppointment({ id: '1', appointmentDate: new Date('2026-03-10') }),
        makeAppointment({ id: '2', appointmentDate: new Date('2026-03-01') }),
        makeAppointment({ id: '3', appointmentDate: new Date('2026-03-20') }),
      ];
      expect(AppointmentEntity.getUpcomingCount(appointments, new Date('2026-03-05'))).toBe(2);
    });

    it('今日の予約もカウントする', () => {
      const appointments = [
        makeAppointment({ id: '1', appointmentDate: new Date('2026-03-05') }),
      ];
      expect(AppointmentEntity.getUpcomingCount(appointments, new Date('2026-03-05'))).toBe(1);
    });
  });
});
