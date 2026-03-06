import { describe, it, expect } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (date: string): Appointment => ({
  id: `apt-${date}`,
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date(date),
  reminderEnabled: false,
  reminderDaysBefore: 1,
  createdAt: new Date(),
});

describe('AppointmentEntity 通院間隔エッジケース', () => {
  describe('getAverageInterval 追加テスト', () => {
    it('同日の2件は間隔0を返す', () => {
      const apts = [
        createAppointment('2026-03-05'),
        createAppointment('2026-03-05'),
      ];
      expect(AppointmentEntity.getAverageInterval(apts)).toBe(0);
    });

    it('4件の等間隔は正しく平均を返す', () => {
      const apts = [
        createAppointment('2026-03-01'),
        createAppointment('2026-03-08'),
        createAppointment('2026-03-15'),
        createAppointment('2026-03-22'),
      ];
      expect(AppointmentEntity.getAverageInterval(apts)).toBe(7);
    });

    it('不等間隔の平均を正しく計算する', () => {
      const apts = [
        createAppointment('2026-03-01'),
        createAppointment('2026-03-04'), // 3日
        createAppointment('2026-03-14'), // 10日
      ];
      // 平均: (3+10)/2 = 6.5 → 7
      expect(AppointmentEntity.getAverageInterval(apts)).toBe(7);
    });
  });

  describe('getNextRecommendedDate 追加テスト', () => {
    it('年をまたぐ場合も正しく計算する', () => {
      expect(AppointmentEntity.getNextRecommendedDate(new Date('2026-12-25'), 14)).toBe('2027-01-08');
    });

    it('大きな間隔も計算する', () => {
      expect(AppointmentEntity.getNextRecommendedDate(new Date('2026-01-01'), 90)).toBe('2026-04-01');
    });
  });

  describe('getLongestGap 追加テスト', () => {
    it('同日の2件は間隔0を返す', () => {
      const apts = [
        createAppointment('2026-03-05'),
        createAppointment('2026-03-05'),
      ];
      const result = AppointmentEntity.getLongestGap(apts);
      expect(result!.days).toBe(0);
    });

    it('3件で最も長い間隔を正しく特定する', () => {
      const apts = [
        createAppointment('2026-03-01'),
        createAppointment('2026-03-05'),  // 4日
        createAppointment('2026-03-20'),  // 15日
      ];
      const result = AppointmentEntity.getLongestGap(apts);
      expect(result!.days).toBe(15);
      expect(result!.from).toBe('2026-03-05');
      expect(result!.to).toBe('2026-03-20');
    });

    it('等間隔の場合は最初のペアを返す', () => {
      const apts = [
        createAppointment('2026-03-01'),
        createAppointment('2026-03-08'),
        createAppointment('2026-03-15'),
      ];
      const result = AppointmentEntity.getLongestGap(apts);
      expect(result!.days).toBe(7);
    });
  });
});
