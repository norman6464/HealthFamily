import { describe, it, expect } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (date: string, overrides: Partial<Appointment> = {}): Appointment => ({
  id: `apt-${date}`,
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date(date),
  reminderEnabled: false,
  reminderDaysBefore: 1,
  createdAt: new Date(),
  ...overrides,
});

describe('AppointmentEntity 通院間隔分析', () => {
  describe('getAverageInterval', () => {
    it('空配列はnullを返す', () => {
      expect(AppointmentEntity.getAverageInterval([])).toBeNull();
    });

    it('1件のみはnullを返す', () => {
      expect(AppointmentEntity.getAverageInterval([createAppointment('2026-03-05')])).toBeNull();
    });

    it('2件の場合はその間隔を返す', () => {
      const apts = [
        createAppointment('2026-03-10'),
        createAppointment('2026-03-05'),
      ];
      expect(AppointmentEntity.getAverageInterval(apts)).toBe(5);
    });

    it('3件の場合は平均間隔を返す', () => {
      const apts = [
        createAppointment('2026-03-15'),
        createAppointment('2026-03-10'),
        createAppointment('2026-03-01'),
      ];
      // 間隔: 5日, 9日 → 平均7日
      expect(AppointmentEntity.getAverageInterval(apts)).toBe(7);
    });

    it('順不同でも正しく計算する', () => {
      const apts = [
        createAppointment('2026-03-01'),
        createAppointment('2026-03-15'),
        createAppointment('2026-03-10'),
      ];
      expect(AppointmentEntity.getAverageInterval(apts)).toBe(7);
    });
  });

  describe('getNextRecommendedDate', () => {
    it('最終予約日と平均間隔から推奨日を算出する', () => {
      const result = AppointmentEntity.getNextRecommendedDate(new Date('2026-03-05'), 14);
      expect(result).toBe('2026-03-19');
    });

    it('月をまたぐ場合も正しく計算する', () => {
      const result = AppointmentEntity.getNextRecommendedDate(new Date('2026-03-25'), 10);
      expect(result).toBe('2026-04-04');
    });

    it('間隔0日の場合は同日を返す', () => {
      const result = AppointmentEntity.getNextRecommendedDate(new Date('2026-03-05'), 0);
      expect(result).toBe('2026-03-05');
    });
  });

  describe('getLongestGap', () => {
    it('空配列はnullを返す', () => {
      expect(AppointmentEntity.getLongestGap([])).toBeNull();
    });

    it('1件のみはnullを返す', () => {
      expect(AppointmentEntity.getLongestGap([createAppointment('2026-03-05')])).toBeNull();
    });

    it('最も長い間隔を返す', () => {
      const apts = [
        createAppointment('2026-03-20'),
        createAppointment('2026-03-10'),
        createAppointment('2026-03-01'),
      ];
      // 間隔: 10日, 9日 → 最長10日
      const result = AppointmentEntity.getLongestGap(apts);
      expect(result).not.toBeNull();
      expect(result!.days).toBe(10);
    });

    it('開始日と終了日を正しく返す', () => {
      const apts = [
        createAppointment('2026-03-20'),
        createAppointment('2026-03-01'),
      ];
      const result = AppointmentEntity.getLongestGap(apts);
      expect(result!.from).toBe('2026-03-01');
      expect(result!.to).toBe('2026-03-20');
    });
  });
});
