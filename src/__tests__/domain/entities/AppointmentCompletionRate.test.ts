import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Appointment Completion Rate', () => {
  describe('getAppointmentCompletionRate', () => {
    it('空配列は0', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([])).toBe(0);
    });

    it('全て完了は100', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([true, true, true])).toBe(100);
    });

    it('全て未完了は0', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([false, false, false])).toBe(0);
    });

    it('半分完了は50', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([true, false, true, false])).toBe(50);
    });

    it('1件完了は100', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([true])).toBe(100);
    });

    it('1件未完了は0', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([false])).toBe(0);
    });

    it('3件中1件完了は33', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([true, false, false])).toBe(33);
    });

    it('3件中2件完了は67', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([true, true, false])).toBe(67);
    });
  });

  describe('getAppointmentCompletionLabel', () => {
    it('90以上は優秀', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(90)).toBe('優秀');
    });

    it('70以上は良好', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(70)).toBe('良好');
    });

    it('50以上は要改善', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(50)).toBe('要改善');
    });

    it('50未満は不十分', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(30)).toBe('不十分');
    });
  });
});
