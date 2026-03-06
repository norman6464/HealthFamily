import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Schedule Gap Minutes Edge Cases', () => {
  describe('getScheduleGapMinutes', () => {
    it('全て同じ時刻', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['12:00', '12:00', '12:00'])).toBe(0);
    });

    it('深夜と朝', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['00:00', '06:00'])).toBe(360);
    });

    it('1日の端から端', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['00:00', '23:59'])).toBe(1439);
    });

    it('4件で不均等', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['08:00', '08:30', '12:00', '20:00'])).toBe(480);
    });

    it('2件で1分差', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['12:00', '12:01'])).toBe(1);
    });

    it('大量の同一時刻', () => {
      const times = Array.from({ length: 50 }, () => '08:00');
      expect(ScheduleEntity.getScheduleGapMinutes(times)).toBe(0);
    });
  });

  describe('getScheduleGapLabel', () => {
    it('1分は短い', () => {
      expect(ScheduleEntity.getScheduleGapLabel(1)).toBe('短い');
    });

    it('179分は短い', () => {
      expect(ScheduleEntity.getScheduleGapLabel(179)).toBe('短い');
    });

    it('180分は適切（閾値境界）', () => {
      expect(ScheduleEntity.getScheduleGapLabel(180)).toBe('適切');
    });

    it('479分は適切', () => {
      expect(ScheduleEntity.getScheduleGapLabel(479)).toBe('適切');
    });

    it('480分は長い（閾値境界）', () => {
      expect(ScheduleEntity.getScheduleGapLabel(480)).toBe('長い');
    });

    it('1440分は長い', () => {
      expect(ScheduleEntity.getScheduleGapLabel(1440)).toBe('長い');
    });
  });
});
