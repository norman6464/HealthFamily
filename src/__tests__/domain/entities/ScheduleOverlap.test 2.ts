import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

interface SimpleSchedule {
  id: string;
  time: string;
  daysOfWeek: string[];
  medicationName: string;
}

describe('ScheduleEntity スケジュール重複検知', () => {
  describe('findOverlappingSchedules', () => {
    it('空配列は空配列を返す', () => {
      expect(ScheduleEntity.findOverlappingSchedules([])).toEqual([]);
    });

    it('1件のみは空配列を返す', () => {
      const schedules: SimpleSchedule[] = [
        { id: '1', time: '08:00', daysOfWeek: ['mon'], medicationName: '薬A' },
      ];
      expect(ScheduleEntity.findOverlappingSchedules(schedules)).toEqual([]);
    });

    it('同じ時間・同じ曜日のスケジュールは重複として検知する', () => {
      const schedules: SimpleSchedule[] = [
        { id: '1', time: '08:00', daysOfWeek: ['mon'], medicationName: '薬A' },
        { id: '2', time: '08:00', daysOfWeek: ['mon'], medicationName: '薬B' },
      ];
      const result = ScheduleEntity.findOverlappingSchedules(schedules);
      expect(result).toHaveLength(1);
      expect(result[0].scheduleIds).toContain('1');
      expect(result[0].scheduleIds).toContain('2');
    });

    it('異なる時間は重複しない', () => {
      const schedules: SimpleSchedule[] = [
        { id: '1', time: '08:00', daysOfWeek: ['mon'], medicationName: '薬A' },
        { id: '2', time: '12:00', daysOfWeek: ['mon'], medicationName: '薬B' },
      ];
      expect(ScheduleEntity.findOverlappingSchedules(schedules)).toEqual([]);
    });

    it('異なる曜日は重複しない', () => {
      const schedules: SimpleSchedule[] = [
        { id: '1', time: '08:00', daysOfWeek: ['mon'], medicationName: '薬A' },
        { id: '2', time: '08:00', daysOfWeek: ['tue'], medicationName: '薬B' },
      ];
      expect(ScheduleEntity.findOverlappingSchedules(schedules)).toEqual([]);
    });

    it('曜日未設定（毎日）同士は時間が同じなら重複する', () => {
      const schedules: SimpleSchedule[] = [
        { id: '1', time: '08:00', daysOfWeek: [], medicationName: '薬A' },
        { id: '2', time: '08:00', daysOfWeek: [], medicationName: '薬B' },
      ];
      const result = ScheduleEntity.findOverlappingSchedules(schedules);
      expect(result).toHaveLength(1);
    });
  });

  describe('hasTimeConflict', () => {
    it('同じ時間はtrueを返す', () => {
      expect(ScheduleEntity.hasTimeConflict('08:00', '08:00')).toBe(true);
    });

    it('15分差以内はtrueを返す（デフォルト）', () => {
      expect(ScheduleEntity.hasTimeConflict('08:00', '08:10')).toBe(true);
    });

    it('16分差はfalseを返す（デフォルト）', () => {
      expect(ScheduleEntity.hasTimeConflict('08:00', '08:16')).toBe(false);
    });

    it('カスタム閾値で判定する', () => {
      expect(ScheduleEntity.hasTimeConflict('08:00', '08:25', 30)).toBe(true);
      expect(ScheduleEntity.hasTimeConflict('08:00', '08:31', 30)).toBe(false);
    });
  });

  describe('getConflictMessage', () => {
    it('重複メッセージを生成する', () => {
      const result = ScheduleEntity.getConflictMessage('薬A', '薬B', '08:00');
      expect(result).toBe('薬Aと薬Bが08:00に重複しています');
    });
  });
});
