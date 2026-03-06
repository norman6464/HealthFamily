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

describe('AppointmentEntity 種別分布分析', () => {
  describe('getTypeDistribution', () => {
    it('空配列は空配列を返す', () => {
      expect(AppointmentEntity.getTypeDistribution([])).toEqual([]);
    });

    it('種別ごとの件数と割合を返す', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'treatment' }),
        createAppointment({ appointmentType: 'vaccination' }),
      ];
      const result = AppointmentEntity.getTypeDistribution(appointments);
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ type: 'checkup', label: '定期検診', count: 2, percentage: 50 });
      expect(result[1].count).toBe(1);
    });

    it('件数が多い順にソートされる', () => {
      const appointments = [
        createAppointment({ appointmentType: 'vaccination' }),
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'vaccination' }),
      ];
      const result = AppointmentEntity.getTypeDistribution(appointments);
      expect(result[0].type).toBe('checkup');
      expect(result[1].type).toBe('vaccination');
    });

    it('種別未設定はotherとして集計する', () => {
      const appointments = [
        createAppointment({}),
        createAppointment({ appointmentType: 'checkup' }),
      ];
      const result = AppointmentEntity.getTypeDistribution(appointments);
      const other = result.find((r) => r.type === 'other');
      expect(other).toBeDefined();
      expect(other!.count).toBe(1);
    });
  });

  describe('getMostFrequentType', () => {
    it('空配列はnullを返す', () => {
      expect(AppointmentEntity.getMostFrequentType([])).toBeNull();
    });

    it('最も多い種別を返す', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'treatment' }),
        createAppointment({ appointmentType: 'checkup' }),
      ];
      const result = AppointmentEntity.getMostFrequentType(appointments);
      expect(result!.type).toBe('checkup');
      expect(result!.count).toBe(2);
    });

    it('ラベル付きで返す', () => {
      const appointments = [
        createAppointment({ appointmentType: 'vaccination' }),
      ];
      const result = AppointmentEntity.getMostFrequentType(appointments);
      expect(result!.label).toBe('予防接種');
    });
  });

  describe('getTypePercentage', () => {
    it('空配列は0を返す', () => {
      expect(AppointmentEntity.getTypePercentage([], 'checkup')).toBe(0);
    });

    it('特定種別の割合を返す', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'checkup' }),
        createAppointment({ appointmentType: 'treatment' }),
        createAppointment({ appointmentType: 'vaccination' }),
      ];
      expect(AppointmentEntity.getTypePercentage(appointments, 'checkup')).toBe(50);
    });

    it('該当種別がない場合は0を返す', () => {
      const appointments = [
        createAppointment({ appointmentType: 'checkup' }),
      ];
      expect(AppointmentEntity.getTypePercentage(appointments, 'surgery')).toBe(0);
    });
  });
});
