import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Schedule Adherence Rate', () => {
  describe('getScheduleAdherenceRate', () => {
    it('空配列は0', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([])).toBe(0);
    });

    it('全て完了は100', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true, true, true, true, true])).toBe(100);
    });

    it('全て未完了は0', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([false, false, false, false])).toBe(0);
    });

    it('半分完了は50', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true, false, true, false])).toBe(50);
    });

    it('1件のみ完了', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([true])).toBe(100);
    });

    it('1件のみ未完了', () => {
      expect(ScheduleEntity.getScheduleAdherenceRate([false])).toBe(0);
    });
  });

  describe('getAdherenceRateLabel', () => {
    it('高い遵守率', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(90)).toBe('優秀');
    });

    it('中程度の遵守率', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(70)).toBe('良好');
    });

    it('低い遵守率', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(50)).toBe('要改善');
    });

    it('非常に低い遵守率', () => {
      expect(ScheduleEntity.getAdherenceRateLabel(20)).toBe('不十分');
    });
  });
});
