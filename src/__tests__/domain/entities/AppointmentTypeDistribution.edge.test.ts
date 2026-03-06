import { describe, it, expect } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: `apt-${Math.random()}`,
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date('2026-03-01'),
  reminderEnabled: false,
  reminderDaysBefore: 1,
  createdAt: new Date(),
  ...overrides,
});

describe('AppointmentEntity 種別分布 エッジケース', () => {
  describe('getTypeDistribution エッジケース', () => {
    it('全て同じ種別は100%を返す', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
      ];
      const result = AppointmentEntity.getTypeDistribution(appointments);
      expect(result).toHaveLength(1);
      expect(result[0].percentage).toBe(100);
    });

    it('1件のみは100%を返す', () => {
      const appointments = [createAppointment({ appointmentType: 'treatment' })];
      const result = AppointmentEntity.getTypeDistribution(appointments);
      expect(result[0].percentage).toBe(100);
      expect(result[0].label).toBe('治療');
    });

    it('未知の種別はそのまま表示する', () => {
      const appointments = [createAppointment({ appointmentType: 'custom_type' })];
      const result = AppointmentEntity.getTypeDistribution(appointments);
      expect(result[0].label).toBe('custom_type');
    });

    it('3種別が均等な場合の割合', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'treatment' }),
        createAppointment({ appointmentType: 'vaccination' }),
      ];
      const result = AppointmentEntity.getTypeDistribution(appointments);
      expect(result.every((r) => r.percentage === 33)).toBe(true);
    });
  });

  describe('getMostFrequentType エッジケース', () => {
    it('1件のみでもnullではない', () => {
      const appointments = [createAppointment({ appointmentType: 'surgery' })];
      const result = AppointmentEntity.getMostFrequentType(appointments);
      expect(result).not.toBeNull();
      expect(result!.type).toBe('surgery');
      expect(result!.label).toBe('手術');
    });

    it('種別未設定のみの場合otherを返す', () => {
      const appointments = [createAppointment({}), createAppointment({})];
      const result = AppointmentEntity.getMostFrequentType(appointments);
      expect(result!.type).toBe('other');
      expect(result!.label).toBe('その他');
    });
  });

  describe('getTypePercentage エッジケース', () => {
    it('全て同じ種別は100を返す', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
      ];
      expect(AppointmentEntity.getTypePercentage(appointments, 'checkup')).toBe(100);
    });

    it('種別未設定はotherとして計算される', () => {
      const appointments = [createAppointment({})];
      expect(AppointmentEntity.getTypePercentage(appointments, 'other')).toBe(100);
    });
  });
});
