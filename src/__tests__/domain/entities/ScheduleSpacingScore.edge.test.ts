import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Spacing Score Edge Cases', () => {
  describe('getScheduleSpacingScore', () => {
    it('2件で均等は100', () => {
      expect(ScheduleEntity.getScheduleSpacingScore(['08:00', '20:00'])).toBe(100);
    });

    it('同じ時刻は100', () => {
      expect(ScheduleEntity.getScheduleSpacingScore(['08:00', '08:00'])).toBe(100);
    });

    it('4件で均等', () => {
      const times = ['06:00', '10:00', '14:00', '18:00'];
      const score = ScheduleEntity.getScheduleSpacingScore(times);
      expect(score).toBe(100);
    });

    it('2件のみ', () => {
      const score = ScheduleEntity.getScheduleSpacingScore(['08:00', '20:00']);
      expect(score).toBe(100);
    });
  });

  describe('getSpacingLabel', () => {
    it('80は均等', () => {
      expect(ScheduleEntity.getSpacingLabel(80)).toBe('均等');
    });

    it('79はやや偏り', () => {
      expect(ScheduleEntity.getSpacingLabel(79)).toBe('やや偏り');
    });

    it('50はやや偏り', () => {
      expect(ScheduleEntity.getSpacingLabel(50)).toBe('やや偏り');
    });

    it('49は偏りあり', () => {
      expect(ScheduleEntity.getSpacingLabel(49)).toBe('偏りあり');
    });

    it('0は偏りあり', () => {
      expect(ScheduleEntity.getSpacingLabel(0)).toBe('偏りあり');
    });

    it('100は均等', () => {
      expect(ScheduleEntity.getSpacingLabel(100)).toBe('均等');
    });
  });
});
