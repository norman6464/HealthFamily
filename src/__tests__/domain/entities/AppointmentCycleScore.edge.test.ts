import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Appointment Cycle Score Edge Cases', () => {
  describe('getAppointmentCycleScore', () => {
    it('2件で異なる値', () => {
      const result = AppointmentEntity.getAppointmentCycleScore([10, 30]);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('全て0は100', () => {
      expect(AppointmentEntity.getAppointmentCycleScore([0, 0, 0])).toBe(100);
    });

    it('大量データで均等', () => {
      const intervals = Array(50).fill(14);
      expect(AppointmentEntity.getAppointmentCycleScore(intervals)).toBe(100);
    });

    it('大量データでばらつき', () => {
      const intervals = Array.from({ length: 50 }, (_, i) => i % 2 === 0 ? 7 : 21);
      const result = AppointmentEntity.getAppointmentCycleScore(intervals);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(100);
    });

    it('結果は0-100の範囲内', () => {
      const result = AppointmentEntity.getAppointmentCycleScore([1, 100, 1, 100]);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('getCycleScoreLabel', () => {
    it('境界値70は規則的', () => {
      expect(AppointmentEntity.getCycleScoreLabel(70)).toBe('規則的');
    });

    it('境界値69はやや不規則', () => {
      expect(AppointmentEntity.getCycleScoreLabel(69)).toBe('やや不規則');
    });

    it('境界値40はやや不規則', () => {
      expect(AppointmentEntity.getCycleScoreLabel(40)).toBe('やや不規則');
    });

    it('境界値39は不規則', () => {
      expect(AppointmentEntity.getCycleScoreLabel(39)).toBe('不規則');
    });

    it('0は不規則', () => {
      expect(AppointmentEntity.getCycleScoreLabel(0)).toBe('不規則');
    });

    it('100は規則的', () => {
      expect(AppointmentEntity.getCycleScoreLabel(100)).toBe('規則的');
    });
  });
});
