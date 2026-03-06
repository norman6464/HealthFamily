import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Appointment Completion Rate Edge Cases', () => {
  describe('getAppointmentCompletionRate', () => {
    it('大量データで全完了', () => {
      const completions = Array.from({ length: 1000 }, () => true);
      expect(AppointmentEntity.getAppointmentCompletionRate(completions)).toBe(100);
    });

    it('大量データで全未完了', () => {
      const completions = Array.from({ length: 1000 }, () => false);
      expect(AppointmentEntity.getAppointmentCompletionRate(completions)).toBe(0);
    });

    it('7件中5件完了は71', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([true, true, true, true, true, false, false])).toBe(71);
    });

    it('交互パターン奇数個で末尾true', () => {
      expect(AppointmentEntity.getAppointmentCompletionRate([true, false, true, false, true])).toBe(60);
    });

    it('10件中1件完了は10', () => {
      const completions = [true, ...Array.from({ length: 9 }, () => false)];
      expect(AppointmentEntity.getAppointmentCompletionRate(completions)).toBe(10);
    });

    it('10件中9件完了は90', () => {
      const completions = [...Array.from({ length: 9 }, () => true), false];
      expect(AppointmentEntity.getAppointmentCompletionRate(completions)).toBe(90);
    });
  });

  describe('getAppointmentCompletionLabel', () => {
    it('100は優秀', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(100)).toBe('優秀');
    });

    it('90は優秀（閾値境界）', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(90)).toBe('優秀');
    });

    it('89は良好', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(89)).toBe('良好');
    });

    it('70は良好（閾値境界）', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(70)).toBe('良好');
    });

    it('69は要改善', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(69)).toBe('要改善');
    });

    it('50は要改善（閾値境界）', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(50)).toBe('要改善');
    });

    it('49は不十分', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(49)).toBe('不十分');
    });

    it('0は不十分', () => {
      expect(AppointmentEntity.getAppointmentCompletionLabel(0)).toBe('不十分');
    });
  });
});
