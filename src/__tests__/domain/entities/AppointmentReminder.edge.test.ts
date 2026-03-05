import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppointmentEntity, Appointment } from '@/domain/entities/Appointment';

const createAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
  id: 'apt-1',
  userId: 'user-1',
  memberId: 'member-1',
  appointmentDate: new Date('2026-03-10T00:00:00'),
  reminderEnabled: true,
  reminderDaysBefore: 3,
  createdAt: new Date('2026-03-01'),
  ...overrides,
});

describe('AppointmentEntity リマインダー・ステータスエッジケース', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('shouldRemind 追加境界値', () => {
    it('reminderDaysBefore=0の当日予約はtrueを返す', () => {
      const apt = createAppointment({
        appointmentDate: new Date('2026-03-07'),
        reminderDaysBefore: 0,
      });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(true);
    });

    it('reminderDaysBefore=0の翌日予約はfalseを返す', () => {
      const apt = createAppointment({
        appointmentDate: new Date('2026-03-08'),
        reminderDaysBefore: 0,
      });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(false);
    });

    it('reminderDaysBefore=7のちょうど7日前はtrueを返す', () => {
      const apt = createAppointment({
        appointmentDate: new Date('2026-03-14'),
        reminderDaysBefore: 7,
      });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(true);
    });

    it('reminderDaysBefore=7の8日前はfalseを返す', () => {
      const apt = createAppointment({
        appointmentDate: new Date('2026-03-15'),
        reminderDaysBefore: 7,
      });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(false);
    });
  });

  describe('getStatusLabel 追加境界値', () => {
    it('1日前の予約は「もうすぐ」を返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-08') });
      const entity = new AppointmentEntity(apt);
      expect(entity.getStatusLabel()).toBe('もうすぐ');
    });

    it('ちょうど3日後の予約は「もうすぐ」を返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-10') });
      const entity = new AppointmentEntity(apt);
      expect(entity.getStatusLabel()).toBe('もうすぐ');
    });

    it('30日後の予約は「予定」を返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-04-06') });
      const entity = new AppointmentEntity(apt);
      expect(entity.getStatusLabel()).toBe('予定');
    });
  });

  describe('getReminderUrgency 追加テスト', () => {
    it('負の値(過去)はurgentを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(-1)).toBe('urgent');
    });

    it('ちょうど1日はurgentを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(1)).toBe('urgent');
    });

    it('ちょうど7日はnormalを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(7)).toBe('normal');
    });

    it('14日はnoneを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(14)).toBe('none');
    });
  });
});
