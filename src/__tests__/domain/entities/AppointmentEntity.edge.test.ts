import { describe, it, expect } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date('2026-03-05'),
  reminderEnabled: true,
  reminderDaysBefore: 1,
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

describe('AppointmentEntity エッジケーステスト', () => {
  describe('getFormattedDate 年初・年末', () => {
    it('1月1日を正しくフォーマットする', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: new Date('2026-01-01T00:00:00') }),
      );
      expect(entity.getFormattedDate()).toBe('2026年1月1日(木)');
    });

    it('12月31日を正しくフォーマットする', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: new Date('2026-12-31T00:00:00') }),
      );
      expect(entity.getFormattedDate()).toBe('2026年12月31日(木)');
    });

    it('閏年2月29日を正しくフォーマットする', () => {
      const entity = new AppointmentEntity(
        createAppointment({ appointmentDate: new Date('2024-02-29T00:00:00') }),
      );
      expect(entity.getFormattedDate()).toBe('2024年2月29日(木)');
    });
  });

  describe('countByType エッジケース', () => {
    it('空配列は空オブジェクトを返す', () => {
      expect(AppointmentEntity.countByType([])).toEqual({});
    });

    it('appointmentType未設定はotherにカウントされる', () => {
      const appointments = [createAppointment()];
      expect(AppointmentEntity.countByType(appointments)).toEqual({ other: 1 });
    });

    it('複数種別を正しくカウントする', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'treatment' }),
        createAppointment({ appointmentType: 'vaccination' }),
        createAppointment({ appointmentType: 'vaccination' }),
        createAppointment({ appointmentType: 'vaccination' }),
      ];
      expect(AppointmentEntity.countByType(appointments)).toEqual({
        checkup: 2,
        treatment: 1,
        vaccination: 3,
      });
    });

    it('全て同じ種別の場合', () => {
      const appointments = [
        createAppointment({ appointmentType: 'surgery' }),
        createAppointment({ appointmentType: 'surgery' }),
      ];
      expect(AppointmentEntity.countByType(appointments)).toEqual({ surgery: 2 });
    });
  });

  describe('getUpcomingCount エッジケース', () => {
    const today = new Date('2026-03-05T12:00:00');

    it('空配列は0を返す', () => {
      expect(AppointmentEntity.getUpcomingCount([], today)).toBe(0);
    });

    it('全て過去の予約は0を返す', () => {
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-01') }),
        createAppointment({ appointmentDate: new Date('2026-02-28') }),
      ];
      expect(AppointmentEntity.getUpcomingCount(appointments, today)).toBe(0);
    });

    it('当日の予約はカウントに含まれる', () => {
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-05') }),
      ];
      expect(AppointmentEntity.getUpcomingCount(appointments, today)).toBe(1);
    });

    it('過去と未来が混在する場合、未来のみカウント', () => {
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-01') }),
        createAppointment({ appointmentDate: new Date('2026-03-05') }),
        createAppointment({ appointmentDate: new Date('2026-03-10') }),
        createAppointment({ appointmentDate: new Date('2026-04-01') }),
      ];
      expect(AppointmentEntity.getUpcomingCount(appointments, today)).toBe(3);
    });

    it('全て未来の予約は全件を返す', () => {
      const appointments = [
        createAppointment({ appointmentDate: new Date('2026-03-10') }),
        createAppointment({ appointmentDate: new Date('2026-04-01') }),
      ];
      expect(AppointmentEntity.getUpcomingCount(appointments, today)).toBe(2);
    });
  });
});
