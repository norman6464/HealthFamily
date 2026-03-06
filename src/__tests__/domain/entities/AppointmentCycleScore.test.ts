import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Appointment Cycle Score', () => {
  describe('getAppointmentCycleScore', () => {
    it('空配列は0', () => {
      expect(AppointmentEntity.getAppointmentCycleScore([])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(AppointmentEntity.getAppointmentCycleScore([30])).toBe(0);
    });

    it('完全に均等な間隔は100', () => {
      expect(AppointmentEntity.getAppointmentCycleScore([30, 30, 30, 30])).toBe(100);
    });

    it('ばらつきがある場合はスコアが下がる', () => {
      const result = AppointmentEntity.getAppointmentCycleScore([10, 50, 20, 40]);
      expect(result).toBeLessThan(100);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('極端にばらつきがある場合', () => {
      const result = AppointmentEntity.getAppointmentCycleScore([1, 100, 1, 100]);
      expect(result).toBeLessThan(50);
    });

    it('2件で同じ値は100', () => {
      expect(AppointmentEntity.getAppointmentCycleScore([14, 14])).toBe(100);
    });
  });

  describe('getCycleScoreLabel', () => {
    it('高いスコア', () => {
      expect(AppointmentEntity.getCycleScoreLabel(80)).toBe('規則的');
    });

    it('中程度のスコア', () => {
      expect(AppointmentEntity.getCycleScoreLabel(50)).toBe('やや不規則');
    });

    it('低いスコア', () => {
      expect(AppointmentEntity.getCycleScoreLabel(20)).toBe('不規則');
    });
  });
});
