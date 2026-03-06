import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Efficiency', () => {
  describe('getScheduleEfficiency', () => {
    it('全て時間内は100', () => {
      const delayMinutes = [0, 0, 0, 0];
      expect(ScheduleEntity.getScheduleEfficiency(delayMinutes)).toBe(100);
    });

    it('遅延があると低下', () => {
      const delayMinutes = [0, 30, 0, 60];
      const score = ScheduleEntity.getScheduleEfficiency(delayMinutes);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });

    it('全て大幅遅延は0', () => {
      const delayMinutes = [120, 120, 120];
      expect(ScheduleEntity.getScheduleEfficiency(delayMinutes)).toBe(0);
    });

    it('空配列は100', () => {
      expect(ScheduleEntity.getScheduleEfficiency([])).toBe(100);
    });

    it('1件のみ0分遅延は100', () => {
      expect(ScheduleEntity.getScheduleEfficiency([0])).toBe(100);
    });
  });

  describe('getScheduleEfficiencyLabel', () => {
    it('90以上は優秀', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(90)).toBe('優秀');
    });

    it('70以上は良好', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(70)).toBe('良好');
    });

    it('50以上は普通', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(50)).toBe('普通');
    });

    it('50未満は要改善', () => {
      expect(ScheduleEntity.getScheduleEfficiencyLabel(49)).toBe('要改善');
    });
  });
});
