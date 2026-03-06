import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Regularity Edge Cases', () => {
  describe('getScheduleRegularityScore', () => {
    it('長い履歴で1件のみ未完了', () => {
      const history = Array(100).fill(true);
      history[50] = false;
      expect(ScheduleEntity.getScheduleRegularityScore(history)).toBe(99);
    });

    it('長い履歴で1件のみ完了', () => {
      const history = Array(100).fill(false);
      history[0] = true;
      expect(ScheduleEntity.getScheduleRegularityScore(history)).toBe(1);
    });

    it('2件で1件完了は50', () => {
      expect(ScheduleEntity.getScheduleRegularityScore([true, false])).toBe(50);
    });

    it('3件で2件完了は67', () => {
      expect(ScheduleEntity.getScheduleRegularityScore([true, true, false])).toBe(67);
    });
  });

  describe('getRegularityLabel', () => {
    it('80は優秀', () => {
      expect(ScheduleEntity.getRegularityLabel(80)).toBe('優秀');
    });

    it('79は良好', () => {
      expect(ScheduleEntity.getRegularityLabel(79)).toBe('良好');
    });

    it('60は良好', () => {
      expect(ScheduleEntity.getRegularityLabel(60)).toBe('良好');
    });

    it('59は要改善', () => {
      expect(ScheduleEntity.getRegularityLabel(59)).toBe('要改善');
    });

    it('40は要改善', () => {
      expect(ScheduleEntity.getRegularityLabel(40)).toBe('要改善');
    });

    it('39は不十分', () => {
      expect(ScheduleEntity.getRegularityLabel(39)).toBe('不十分');
    });

    it('0は不十分', () => {
      expect(ScheduleEntity.getRegularityLabel(0)).toBe('不十分');
    });
  });
});
