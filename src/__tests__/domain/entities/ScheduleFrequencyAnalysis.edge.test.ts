import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Frequency Analysis Edge Cases', () => {
  describe('getWeeklyScheduleCount', () => {
    it('全曜日指定で7を返す', () => {
      const schedules = [{ daysOfWeek: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] }];
      expect(ScheduleEntity.getWeeklyScheduleCount(schedules)).toBe(7);
    });

    it('複数スケジュールが全て毎日', () => {
      const schedules = [{ daysOfWeek: [] }, { daysOfWeek: [] }];
      expect(ScheduleEntity.getWeeklyScheduleCount(schedules)).toBe(14);
    });

    it('1曜日のみ', () => {
      const schedules = [{ daysOfWeek: ['mon'] }];
      expect(ScheduleEntity.getWeeklyScheduleCount(schedules)).toBe(1);
    });
  });

  describe('getScheduleLoadLabel', () => {
    it('境界値5で「軽い」', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(5)).toBe('軽い');
    });

    it('境界値6で「普通」', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(6)).toBe('普通');
    });

    it('境界値10で「普通」', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(10)).toBe('普通');
    });

    it('境界値11で「多い」', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(11)).toBe('多い');
    });

    it('境界値19で「多い」', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(19)).toBe('多い');
    });
  });

  describe('getMedicationScheduleSummary', () => {
    it('1薬品のみ', () => {
      const schedules = [{ medicationId: 'a', medicationName: '薬X' }];
      const result = ScheduleEntity.getMedicationScheduleSummary(schedules);
      expect(result).toEqual([{ medicationId: 'a', name: '薬X', count: 1 }]);
    });
  });
});
