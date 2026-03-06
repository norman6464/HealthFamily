import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Spacing Score', () => {
  describe('getScheduleSpacingScore', () => {
    it('均等な間隔は高スコア', () => {
      const times = ['08:00', '14:00', '20:00'];
      const score = ScheduleEntity.getScheduleSpacingScore(times);
      expect(score).toBe(100);
    });

    it('偏った間隔は低スコア', () => {
      const times = ['08:00', '08:30', '20:00'];
      const score = ScheduleEntity.getScheduleSpacingScore(times);
      expect(score).toBeLessThan(80);
    });

    it('1件は100', () => {
      expect(ScheduleEntity.getScheduleSpacingScore(['08:00'])).toBe(100);
    });

    it('空配列は0', () => {
      expect(ScheduleEntity.getScheduleSpacingScore([])).toBe(0);
    });
  });

  describe('getSpacingLabel', () => {
    it('高スコアは均等', () => {
      expect(ScheduleEntity.getSpacingLabel(90)).toBe('均等');
    });

    it('中スコアはやや偏り', () => {
      expect(ScheduleEntity.getSpacingLabel(60)).toBe('やや偏り');
    });

    it('低スコアは偏りあり', () => {
      expect(ScheduleEntity.getSpacingLabel(30)).toBe('偏りあり');
    });
  });
});
