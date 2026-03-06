import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Efficiency Edge Cases', () => {
  describe('getScheduleEfficiency', () => {
    it('全て120分以上遅延は0', () => {
      expect(ScheduleEntity.getScheduleEfficiency([120, 150, 200])).toBe(0);
    });

    it('全て60分遅延は50', () => {
      expect(ScheduleEntity.getScheduleEfficiency([60, 60, 60])).toBe(50);
    });

    it('1件のみ30分遅延', () => {
      expect(ScheduleEntity.getScheduleEfficiency([30])).toBe(75);
    });
  });

  describe('getScheduleEfficiencyLabel', () => {
    it('境界値90は優秀', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(90)).toBe('優秀');
    });

    it('境界値89は良好', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(89)).toBe('良好');
    });

    it('境界値70は良好', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(70)).toBe('良好');
    });

    it('境界値69は普通', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(69)).toBe('普通');
    });

    it('境界値50は普通', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(50)).toBe('普通');
    });

    it('境界値49は要改善', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(49)).toBe('要改善');
    });
  });
});
