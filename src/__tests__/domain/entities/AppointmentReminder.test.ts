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

describe('AppointmentEntity リマインダー判定', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('shouldRemind', () => {
    it('リマインダー無効なら常にfalseを返す', () => {
      const apt = createAppointment({ reminderEnabled: false, reminderDaysBefore: 3 });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(false);
    });

    it('リマインダー日数以内ならtrueを返す', () => {
      // 今日:3/7, 予約:3/10, 残り3日, reminderDaysBefore:3
      const apt = createAppointment({ appointmentDate: new Date('2026-03-10'), reminderDaysBefore: 3 });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(true);
    });

    it('リマインダー日数を超えていたらfalseを返す', () => {
      // 今日:3/7, 予約:3/11, 残り4日, reminderDaysBefore:3
      const apt = createAppointment({ appointmentDate: new Date('2026-03-11'), reminderDaysBefore: 3 });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(false);
    });

    it('過去の予約はfalseを返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-06') });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(false);
    });

    it('当日の予約はtrueを返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-07'), reminderDaysBefore: 1 });
      const entity = new AppointmentEntity(apt);
      expect(entity.shouldRemind()).toBe(true);
    });
  });

  describe('getReminderUrgency', () => {
    it('当日はurgentを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(0)).toBe('urgent');
    });

    it('1日前はurgentを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(1)).toBe('urgent');
    });

    it('2日前はsoonを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(2)).toBe('soon');
    });

    it('3日前はsoonを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(3)).toBe('soon');
    });

    it('4日前はnormalを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(4)).toBe('normal');
    });

    it('7日前はnormalを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(7)).toBe('normal');
    });

    it('8日以上はnoneを返す', () => {
      expect(AppointmentEntity.getReminderUrgency(8)).toBe('none');
    });
  });

  describe('getStatusLabel', () => {
    it('過去の予約は「完了」を返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-06') });
      const entity = new AppointmentEntity(apt);
      expect(entity.getStatusLabel()).toBe('完了');
    });

    it('当日の予約は「本日」を返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-07') });
      const entity = new AppointmentEntity(apt);
      expect(entity.getStatusLabel()).toBe('本日');
    });

    it('3日以内の予約は「もうすぐ」を返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-09') });
      const entity = new AppointmentEntity(apt);
      expect(entity.getStatusLabel()).toBe('もうすぐ');
    });

    it('4日以上先の予約は「予定」を返す', () => {
      const apt = createAppointment({ appointmentDate: new Date('2026-03-15') });
      const entity = new AppointmentEntity(apt);
      expect(entity.getStatusLabel()).toBe('予定');
    });
  });
});
