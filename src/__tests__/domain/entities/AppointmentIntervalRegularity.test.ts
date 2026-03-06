import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Interval Regularity', () => {
  describe('getIntervalRegularity', () => {
    it('均等な間隔は高スコア', () => {
      const intervals = [30, 30, 30];
      const score = AppointmentEntity.getIntervalRegularity(intervals);
      expect(score).toBe(100);
    });

    it('ばらつきがある場合はスコアが下がる', () => {
      const intervals = [10, 30, 50];
      const score = AppointmentEntity.getIntervalRegularity(intervals);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('空配列は0', () => {
      expect(AppointmentEntity.getIntervalRegularity([])).toBe(0);
    });

    it('1件は100', () => {
      expect(AppointmentEntity.getIntervalRegularity([30])).toBe(100);
    });
  });

  describe('getIntervalRegularityLabel', () => {
    it('高スコアは規則的', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(90)).toBe('規則的');
    });

    it('中スコアはやや不規則', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(60)).toBe('やや不規則');
    });

    it('低スコアは不規則', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(40)).toBe('不規則');
    });

    it('0は不規則', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(0)).toBe('不規則');
    });
  });
});
