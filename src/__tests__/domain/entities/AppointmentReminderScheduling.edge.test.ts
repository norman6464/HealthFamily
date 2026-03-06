import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Reminder Scheduling Edge Cases', () => {
  describe('shouldSendReminder', () => {
    it('当日で0日リマインダーはtrue', () => {
      const d = new Date('2026-03-05');
      expect(AppointmentEntity.shouldSendReminder(d, d, 0)).toBe(true);
    });

    it('前日で0日リマインダーはfalse', () => {
      const apt = new Date('2026-03-06');
      const today = new Date('2026-03-05');
      expect(AppointmentEntity.shouldSendReminder(apt, today, 0)).toBe(false);
    });

    it('30日前リマインダー', () => {
      const apt = new Date('2026-04-04');
      const today = new Date('2026-03-05');
      expect(AppointmentEntity.shouldSendReminder(apt, today, 30)).toBe(true);
    });
  });

  describe('getReminderPriority', () => {
    it('境界値2でmedium', () => {
      expect(AppointmentEntity.getReminderPriority(2)).toBe('medium');
    });

    it('境界値4でlow', () => {
      expect(AppointmentEntity.getReminderPriority(4)).toBe('low');
    });

    it('負の値でhigh', () => {
      expect(AppointmentEntity.getReminderPriority(-1)).toBe('high');
    });
  });

  describe('formatReminderSchedule', () => {
    it('21日で3週間前', () => {
      expect(AppointmentEntity.formatReminderSchedule(21)).toBe('3週間前にお知らせ');
    });

    it('10日で10日前', () => {
      expect(AppointmentEntity.formatReminderSchedule(10)).toBe('10日前にお知らせ');
    });
  });
});
