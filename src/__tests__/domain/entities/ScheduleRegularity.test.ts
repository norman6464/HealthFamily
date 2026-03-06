import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Schedule Regularity', () => {
  describe('getScheduleRegularityScore', () => {
    it('全て完了の場合は100', () => {
      expect(ScheduleEntity.getScheduleRegularityScore([true, true, true, true, true])).toBe(100);
    });

    it('全て未完了の場合は0', () => {
      expect(ScheduleEntity.getScheduleRegularityScore([false, false, false])).toBe(0);
    });

    it('半分完了の場合は50', () => {
      expect(ScheduleEntity.getScheduleRegularityScore([true, false, true, false])).toBe(50);
    });

    it('空配列は0', () => {
      expect(ScheduleEntity.getScheduleRegularityScore([])).toBe(0);
    });

    it('1件完了は100', () => {
      expect(ScheduleEntity.getScheduleRegularityScore([true])).toBe(100);
    });
  });

  describe('getRegularityLabel', () => {
    it('100は完璧', () => {
      expect(ScheduleEntity.getRegularityLabel(100)).toBe('完璧');
    });

    it('90は優秀', () => {
      expect(ScheduleEntity.getRegularityLabel(90)).toBe('優秀');
    });

    it('70は良好', () => {
      expect(ScheduleEntity.getRegularityLabel(70)).toBe('良好');
    });

    it('50は要改善', () => {
      expect(ScheduleEntity.getRegularityLabel(50)).toBe('要改善');
    });

    it('30は不十分', () => {
      expect(ScheduleEntity.getRegularityLabel(30)).toBe('不十分');
    });
  });
});
