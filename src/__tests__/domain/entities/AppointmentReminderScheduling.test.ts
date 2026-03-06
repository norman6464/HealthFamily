import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Reminder Scheduling', () => {
  describe('shouldSendReminder', () => {
    it('予約3日前で3日リマインダーならtrueを返す', () => {
      const appointmentDate = new Date('2026-03-08');
      const today = new Date('2026-03-05');
      expect(AppointmentEntity.shouldSendReminder(appointmentDate, today, 3)).toBe(true);
    });

    it('予約2日前で3日リマインダーならfalseを返す', () => {
      const appointmentDate = new Date('2026-03-08');
      const today = new Date('2026-03-06');
      expect(AppointmentEntity.shouldSendReminder(appointmentDate, today, 3)).toBe(false);
    });

    it('予約当日でtrueを返す', () => {
      const date = new Date('2026-03-05');
      expect(AppointmentEntity.shouldSendReminder(date, date, 0)).toBe(true);
    });

    it('予約が過去ならfalseを返す', () => {
      const appointmentDate = new Date('2026-03-01');
      const today = new Date('2026-03-05');
      expect(AppointmentEntity.shouldSendReminder(appointmentDate, today, 3)).toBe(false);
    });
  });

  describe('getReminderPriority', () => {
    it('当日でhighを返す', () => {
      expect(AppointmentEntity.getReminderPriority(0)).toBe('high');
    });

    it('1日前でhighを返す', () => {
      expect(AppointmentEntity.getReminderPriority(1)).toBe('high');
    });

    it('3日前でmediumを返す', () => {
      expect(AppointmentEntity.getReminderPriority(3)).toBe('medium');
    });

    it('7日前でlowを返す', () => {
      expect(AppointmentEntity.getReminderPriority(7)).toBe('low');
    });

    it('14日前でlowを返す', () => {
      expect(AppointmentEntity.getReminderPriority(14)).toBe('low');
    });
  });

  describe('formatReminderSchedule', () => {
    it('1日前リマインダーのテキスト', () => {
      expect(AppointmentEntity.formatReminderSchedule(1)).toBe('1日前にお知らせ');
    });

    it('当日リマインダーのテキスト', () => {
      expect(AppointmentEntity.formatReminderSchedule(0)).toBe('当日にお知らせ');
    });

    it('7日前リマインダーのテキスト', () => {
      expect(AppointmentEntity.formatReminderSchedule(7)).toBe('1週間前にお知らせ');
    });

    it('14日前リマインダーのテキスト', () => {
      expect(AppointmentEntity.formatReminderSchedule(14)).toBe('2週間前にお知らせ');
    });

    it('3日前リマインダーのテキスト', () => {
      expect(AppointmentEntity.formatReminderSchedule(3)).toBe('3日前にお知らせ');
    });
  });
});
