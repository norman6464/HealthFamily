import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Appointment Spacing', () => {
  describe('getAppointmentSpacing', () => {
    it('空配列は0', () => {
      expect(AppointmentEntity.getAppointmentSpacing([])).toBe(0);
    });

    it('1件のみは100', () => {
      expect(AppointmentEntity.getAppointmentSpacing([30])).toBe(100);
    });

    it('均等間隔は100', () => {
      expect(AppointmentEntity.getAppointmentSpacing([30, 30, 30])).toBe(100);
    });

    it('不均等間隔', () => {
      const result = AppointmentEntity.getAppointmentSpacing([7, 30, 60]);
      expect(result).toBeLessThan(100);
      expect(result).toBeGreaterThan(0);
    });

    it('全て同じ間隔は100', () => {
      expect(AppointmentEntity.getAppointmentSpacing([14, 14, 14, 14])).toBe(100);
    });

    it('2件で差が大きい', () => {
      const result = AppointmentEntity.getAppointmentSpacing([1, 100]);
      expect(result).toBeLessThan(50);
    });

    it('全て0は100', () => {
      expect(AppointmentEntity.getAppointmentSpacing([0, 0, 0])).toBe(100);
    });
  });

  describe('getAppointmentSpacingLabel', () => {
    it('均等', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(85)).toBe('均等');
    });

    it('やや不均等', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(60)).toBe('やや不均等');
    });

    it('不均等', () => {
      expect(AppointmentEntity.getAppointmentSpacingLabel(30)).toBe('不均等');
    });
  });
});
