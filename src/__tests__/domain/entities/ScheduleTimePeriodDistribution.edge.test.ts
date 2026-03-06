import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Time Period Distribution Edge Cases', () => {
  describe('getTimePeriodDistribution', () => {
    it('境界値4:59は夜', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['04:59']);
      expect(result.night).toBe(1);
    });

    it('境界値11:59は朝', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['11:59']);
      expect(result.morning).toBe(1);
    });

    it('境界値16:59は午後', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['16:59']);
      expect(result.afternoon).toBe(1);
    });

    it('境界値20:59は夕方', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['20:59']);
      expect(result.evening).toBe(1);
    });

    it('0時は夜', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['00:00']);
      expect(result.night).toBe(1);
    });

    it('23:59は夜', () => {
      const result = ScheduleEntity.getTimePeriodDistribution(['23:59']);
      expect(result.night).toBe(1);
    });

    it('大量のスケジュール', () => {
      const times = Array.from({ length: 100 }, () => '08:00');
      const result = ScheduleEntity.getTimePeriodDistribution(times);
      expect(result.morning).toBe(100);
    });
  });

  describe('getTimePeriodDistributionLabel', () => {
    it('ちょうど60%は均等', () => {
      const dist = { morning: 6, afternoon: 2, evening: 1, night: 1 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('均等');
    });

    it('61%で集中判定', () => {
      const dist = { morning: 61, afternoon: 20, evening: 10, night: 9 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('朝に集中');
    });

    it('2つの時間帯が同率で最大の場合', () => {
      const dist = { morning: 5, afternoon: 5, evening: 0, night: 0 };
      expect(ScheduleEntity.getTimePeriodDistributionLabel(dist)).toBe('均等');
    });
  });
});
