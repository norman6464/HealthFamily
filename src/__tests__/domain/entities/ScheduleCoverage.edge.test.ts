import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Schedule Coverage Edge Cases', () => {
  describe('getScheduleCoverage', () => {
    it('複数の空曜日配列(毎日)でも100', () => {
      expect(ScheduleEntity.getScheduleCoverage([
        { daysOfWeek: [] },
        { daysOfWeek: [] },
      ])).toBe(100);
    });

    it('週末のみは29', () => {
      const result = ScheduleEntity.getScheduleCoverage([{ daysOfWeek: ['sat', 'sun'] }]);
      expect(result).toBe(29);
    });

    it('3スケジュールで全曜日カバー', () => {
      const result = ScheduleEntity.getScheduleCoverage([
        { daysOfWeek: ['mon', 'tue'] },
        { daysOfWeek: ['wed', 'thu'] },
        { daysOfWeek: ['fri', 'sat', 'sun'] },
      ]);
      expect(result).toBe(100);
    });

    it('全て同じ曜日のスケジュール', () => {
      const result = ScheduleEntity.getScheduleCoverage([
        { daysOfWeek: ['mon'] },
        { daysOfWeek: ['mon'] },
        { daysOfWeek: ['mon'] },
      ]);
      expect(result).toBe(14);
    });

    it('空配列と曜日指定の混在', () => {
      const result = ScheduleEntity.getScheduleCoverage([
        { daysOfWeek: ['mon'] },
        { daysOfWeek: [] },
      ]);
      expect(result).toBe(100);
    });

    it('6曜日カバーは86', () => {
      const result = ScheduleEntity.getScheduleCoverage([
        { daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
      ]);
      expect(result).toBe(86);
    });
  });

  describe('getScheduleCoverageLabel', () => {
    it('境界値80は完全', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(80)).toBe('完全');
    });

    it('境界値79は普通', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(79)).toBe('普通');
    });

    it('境界値50は普通', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(50)).toBe('普通');
    });

    it('境界値49は不足', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(49)).toBe('不足');
    });

    it('0は不足', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(0)).toBe('不足');
    });

    it('100は完全', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(100)).toBe('完全');
    });
  });
});
