import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Schedule Gap Minutes', () => {
  describe('getScheduleGapMinutes', () => {
    it('空配列は0', () => {
      expect(ScheduleEntity.getScheduleGapMinutes([])).toBe(0);
    });

    it('1件のみは0', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['08:00'])).toBe(0);
    });

    it('2件の間隔', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['08:00', '12:00'])).toBe(240);
    });

    it('3件で最大間隔を返す', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['08:00', '09:00', '14:00'])).toBe(300);
    });

    it('同じ時刻は0', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['08:00', '08:00'])).toBe(0);
    });

    it('順序が不正でも正しくソート', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['14:00', '08:00'])).toBe(360);
    });

    it('均等間隔', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['06:00', '12:00', '18:00'])).toBe(360);
    });

    it('1分差', () => {
      expect(ScheduleEntity.getScheduleGapMinutes(['08:00', '08:01'])).toBe(1);
    });
  });

  describe('getScheduleGapLabel', () => {
    it('0分は間隔なし', () => {
      expect(ScheduleEntity.getScheduleGapLabel(0)).toBe('間隔なし');
    });

    it('120分は短い', () => {
      expect(ScheduleEntity.getScheduleGapLabel(120)).toBe('短い');
    });

    it('360分は適切', () => {
      expect(ScheduleEntity.getScheduleGapLabel(360)).toBe('適切');
    });

    it('480分以上は長い', () => {
      expect(ScheduleEntity.getScheduleGapLabel(480)).toBe('長い');
    });
  });
});
