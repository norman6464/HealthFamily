import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Time Slot Edge Cases', () => {
  describe('hasTimeOverlap 境界値', () => {
    it('0分閾値の場合同一時刻のみ重複', () => {
      expect(ScheduleEntity.hasTimeOverlap('08:00', '08:00', 0)).toBe(true);
      expect(ScheduleEntity.hasTimeOverlap('08:00', '08:01', 0)).toBe(false);
    });

    it('深夜の時刻', () => {
      expect(ScheduleEntity.hasTimeOverlap('00:00', '00:30', 30)).toBe(true);
    });

    it('23:59の時刻', () => {
      expect(ScheduleEntity.hasTimeOverlap('23:30', '23:59', 30)).toBe(true);
    });
  });

  describe('getScheduleDensity 境界値', () => {
    it('非常に多い件数', () => {
      expect(ScheduleEntity.getScheduleDensity(100)).toBe('high');
    });
  });

  describe('getOptimalTimeSuggestion 境界値', () => {
    it('全候補時刻に既存がある場合', () => {
      const times = ['08:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
      const result = ScheduleEntity.getOptimalTimeSuggestion(times);
      expect(result).toBeTruthy();
    });

    it('近い時刻が複数ある場合', () => {
      const result = ScheduleEntity.getOptimalTimeSuggestion(['12:00', '13:00']);
      expect(result).toBeTruthy();
    });
  });
});
