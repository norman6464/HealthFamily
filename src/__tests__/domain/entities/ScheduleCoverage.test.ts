import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Schedule Coverage', () => {
  describe('getScheduleCoverage', () => {
    it('空配列は0', () => {
      expect(ScheduleEntity.getScheduleCoverage([])).toBe(0);
    });

    it('空の曜日配列(毎日)は100', () => {
      expect(ScheduleEntity.getScheduleCoverage([{ daysOfWeek: [] }])).toBe(100);
    });

    it('全曜日指定は100', () => {
      expect(ScheduleEntity.getScheduleCoverage([{ daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }])).toBe(100);
    });

    it('平日のみは71', () => {
      const result = ScheduleEntity.getScheduleCoverage([{ daysOfWeek: ['mon', 'tue', 'wed', 'thu', 'fri'] }]);
      expect(result).toBe(71);
    });

    it('1日のみは14', () => {
      const result = ScheduleEntity.getScheduleCoverage([{ daysOfWeek: ['mon'] }]);
      expect(result).toBe(14);
    });

    it('複数スケジュールで曜日が重複', () => {
      const result = ScheduleEntity.getScheduleCoverage([
        { daysOfWeek: ['mon', 'wed'] },
        { daysOfWeek: ['mon', 'fri'] },
      ]);
      expect(result).toBe(43);
    });

    it('複数スケジュールで全曜日カバー', () => {
      const result = ScheduleEntity.getScheduleCoverage([
        { daysOfWeek: ['mon', 'tue', 'wed', 'thu'] },
        { daysOfWeek: ['fri', 'sat', 'sun'] },
      ]);
      expect(result).toBe(100);
    });
  });

  describe('getScheduleCoverageLabel', () => {
    it('高いカバー率', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(100)).toBe('完全');
    });

    it('中程度のカバー率', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(60)).toBe('普通');
    });

    it('低いカバー率', () => {
      expect(ScheduleEntity.getScheduleCoverageLabel(20)).toBe('不足');
    });
  });
});
