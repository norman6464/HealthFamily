import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity 時間帯グループ化', () => {
  describe('getTimePeriod', () => {
    it('5:00は朝', () => {
      expect(ScheduleEntity.getTimePeriod('05:00')).toBe('morning');
    });

    it('11:59は朝', () => {
      expect(ScheduleEntity.getTimePeriod('11:59')).toBe('morning');
    });

    it('12:00は昼', () => {
      expect(ScheduleEntity.getTimePeriod('12:00')).toBe('afternoon');
    });

    it('16:59は昼', () => {
      expect(ScheduleEntity.getTimePeriod('16:59')).toBe('afternoon');
    });

    it('17:00は夕', () => {
      expect(ScheduleEntity.getTimePeriod('17:00')).toBe('evening');
    });

    it('20:59は夕', () => {
      expect(ScheduleEntity.getTimePeriod('20:59')).toBe('evening');
    });

    it('21:00は夜', () => {
      expect(ScheduleEntity.getTimePeriod('21:00')).toBe('night');
    });

    it('23:59は夜', () => {
      expect(ScheduleEntity.getTimePeriod('23:59')).toBe('night');
    });

    it('00:00は夜', () => {
      expect(ScheduleEntity.getTimePeriod('00:00')).toBe('night');
    });

    it('04:59は夜', () => {
      expect(ScheduleEntity.getTimePeriod('04:59')).toBe('night');
    });
  });

  describe('getTimePeriodLabel', () => {
    it('morningは朝', () => {
      expect(ScheduleEntity.getTimePeriodLabel('morning')).toBe('朝');
    });

    it('afternoonは昼', () => {
      expect(ScheduleEntity.getTimePeriodLabel('afternoon')).toBe('昼');
    });

    it('eveningは夕', () => {
      expect(ScheduleEntity.getTimePeriodLabel('evening')).toBe('夕');
    });

    it('nightは夜', () => {
      expect(ScheduleEntity.getTimePeriodLabel('night')).toBe('夜');
    });
  });

  describe('groupByTimePeriod', () => {
    it('空配列で全時間帯が空のグループを返す', () => {
      const result = ScheduleEntity.groupByTimePeriod([]);
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ period: 'morning', label: '朝', schedules: [] });
      expect(result[1]).toEqual({ period: 'afternoon', label: '昼', schedules: [] });
      expect(result[2]).toEqual({ period: 'evening', label: '夕', schedules: [] });
      expect(result[3]).toEqual({ period: 'night', label: '夜', schedules: [] });
    });

    it('スケジュールを正しい時間帯に分類する', () => {
      const schedules = [
        { scheduledTime: '08:00', id: '1' },
        { scheduledTime: '12:30', id: '2' },
        { scheduledTime: '18:00', id: '3' },
        { scheduledTime: '22:00', id: '4' },
      ];
      const result = ScheduleEntity.groupByTimePeriod(schedules as any);
      expect(result[0].schedules).toHaveLength(1); // morning
      expect(result[1].schedules).toHaveLength(1); // afternoon
      expect(result[2].schedules).toHaveLength(1); // evening
      expect(result[3].schedules).toHaveLength(1); // night
    });

    it('同じ時間帯に複数のスケジュールをグループ化する', () => {
      const schedules = [
        { scheduledTime: '08:00', id: '1' },
        { scheduledTime: '09:00', id: '2' },
        { scheduledTime: '10:00', id: '3' },
      ];
      const result = ScheduleEntity.groupByTimePeriod(schedules as any);
      expect(result[0].schedules).toHaveLength(3); // all morning
      expect(result[1].schedules).toHaveLength(0);
      expect(result[2].schedules).toHaveLength(0);
      expect(result[3].schedules).toHaveLength(0);
    });
  });
});
