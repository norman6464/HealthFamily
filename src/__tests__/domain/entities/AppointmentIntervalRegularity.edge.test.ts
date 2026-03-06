import { AppointmentEntity } from '@/domain/entities/Appointment';

describe('AppointmentEntity - Interval Regularity Edge Cases', () => {
  describe('getIntervalRegularity', () => {
    it('全て同じ間隔は100', () => {
      expect(AppointmentEntity.getIntervalRegularity([14, 14, 14, 14])).toBe(100);
    });

    it('全て0は100', () => {
      expect(AppointmentEntity.getIntervalRegularity([0, 0, 0])).toBe(100);
    });

    it('大きなばらつき', () => {
      const score = AppointmentEntity.getIntervalRegularity([1, 100]);
      expect(score).toBeLessThan(50);
    });

    it('2件の同じ値は100', () => {
      expect(AppointmentEntity.getIntervalRegularity([30, 30])).toBe(100);
    });

    it('わずかなばらつき', () => {
      const score = AppointmentEntity.getIntervalRegularity([29, 30, 31]);
      expect(score).toBeGreaterThan(90);
    });
  });

  describe('getIntervalRegularityLabel', () => {
    it('80は規則的', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(80)).toBe('規則的');
    });

    it('79はやや不規則', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(79)).toBe('やや不規則');
    });

    it('50はやや不規則', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(50)).toBe('やや不規則');
    });

    it('49は不規則', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(49)).toBe('不規則');
    });

    it('100は規則的', () => {
      expect(AppointmentEntity.getIntervalRegularityLabel(100)).toBe('規則的');
    });
  });
});
