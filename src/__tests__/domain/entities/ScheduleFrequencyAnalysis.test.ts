import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity - Frequency Analysis', () => {
  describe('getWeeklyScheduleCount', () => {
    it('毎日のスケジュールで7を返す', () => {
      const schedules = [{ daysOfWeek: [] }]; // 空は毎日
      expect(ScheduleEntity.getWeeklyScheduleCount(schedules)).toBe(7);
    });

    it('特定曜日のスケジュールで正しい数を返す', () => {
      const schedules = [
        { daysOfWeek: ['mon', 'wed', 'fri'] },
        { daysOfWeek: ['tue', 'thu'] },
      ];
      expect(ScheduleEntity.getWeeklyScheduleCount(schedules)).toBe(5);
    });

    it('空配列で0を返す', () => {
      expect(ScheduleEntity.getWeeklyScheduleCount([])).toBe(0);
    });

    it('重複曜日を含む場合は合計を返す', () => {
      const schedules = [
        { daysOfWeek: ['mon'] },
        { daysOfWeek: ['mon'] },
      ];
      expect(ScheduleEntity.getWeeklyScheduleCount(schedules)).toBe(2);
    });
  });

  describe('getMedicationScheduleSummary', () => {
    it('薬別の件数を返す', () => {
      const schedules = [
        { medicationId: 'med1', medicationName: '薬A' },
        { medicationId: 'med1', medicationName: '薬A' },
        { medicationId: 'med2', medicationName: '薬B' },
      ];
      const result = ScheduleEntity.getMedicationScheduleSummary(schedules);
      expect(result).toContainEqual({ medicationId: 'med1', name: '薬A', count: 2 });
      expect(result).toContainEqual({ medicationId: 'med2', name: '薬B', count: 1 });
    });

    it('空配列で空配列を返す', () => {
      expect(ScheduleEntity.getMedicationScheduleSummary([])).toEqual([]);
    });

    it('件数降順でソートされる', () => {
      const schedules = [
        { medicationId: 'med1', medicationName: '薬A' },
        { medicationId: 'med2', medicationName: '薬B' },
        { medicationId: 'med2', medicationName: '薬B' },
      ];
      const result = ScheduleEntity.getMedicationScheduleSummary(schedules);
      expect(result[0].count).toBeGreaterThanOrEqual(result[1].count);
    });
  });

  describe('getScheduleLoadLabel', () => {
    it('0件で「なし」を返す', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(0)).toBe('なし');
    });

    it('3件で「軽い」を返す', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(3)).toBe('軽い');
    });

    it('7件で「普通」を返す', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(7)).toBe('普通');
    });

    it('15件で「多い」を返す', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(15)).toBe('多い');
    });

    it('20件以上で「非常に多い」を返す', () => {
      expect(ScheduleEntity.getScheduleLoadLabel(20)).toBe('非常に多い');
    });
  });
});
