import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Schedule Adherence Rate Edge Cases', () => {
  describe('getScheduleAdherenceRate', () => {
    it('1件完了で100', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true])).toBe(100);
    });

    it('1件未完了で0', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([false])).toBe(0);
    });

    it('大量データで全完了', () => {
      const completions = Array.from({ length: 1000 }, () => true);
      expect(ScheduleEntity.getScheduleAdherenceRate(completions)).toBe(100);
    });

    it('大量データで全未完了', () => {
      const completions = Array.from({ length: 1000 }, () => false);
      expect(ScheduleEntity.getScheduleAdherenceRate(completions)).toBe(0);
    });

    it('3件中1件完了は33', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true, false, false])).toBe(33);
    });

    it('3件中2件完了は67', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true, true, false])).toBe(67);
    });

    it('7件中3件完了は43', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true, true, true, false, false, false, false])).toBe(43);
    });

    it('交互パターン', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true, false, true, false, true, false])).toBe(50);
    });

    it('2件中1件完了は50', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true, false])).toBe(50);
    });

    it('10件中9件完了は90', () => {
      const completions = [true, true, true, true, true, true, true, true, true, false];
      expect(ScheduleEntity.getScheduleAdherenceRate(completions)).toBe(90);
    });
  });

  describe('getAdherenceRateLabel', () => {
    it('90は優秀', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(90)).toBe('優秀');
    });

    it('89は良好', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(89)).toBe('良好');
    });

    it('70は良好', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(70)).toBe('良好');
    });

    it('69は要改善', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(69)).toBe('要改善');
    });

    it('50は要改善', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(50)).toBe('要改善');
    });

    it('49は不十分', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(49)).toBe('不十分');
    });

    it('0は不十分', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(0)).toBe('不十分');
    });

    it('100は優秀', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(100)).toBe('優秀');
    });
  });
});
