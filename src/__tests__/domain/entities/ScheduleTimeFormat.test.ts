import { describe, it, expect } from 'vitest';
import { ScheduleEntity, DayOfWeek } from '@/domain/entities/Schedule';

describe('ScheduleEntity 時間フォーマットユーティリティ', () => {
  describe('formatTimeRange', () => {
    it('開始時刻と分数から範囲を返す', () => {
      expect(ScheduleEntity.formatTimeRange('08:00', 30)).toBe('08:00 - 08:30');
    });

    it('時間をまたぐ場合', () => {
      expect(ScheduleEntity.formatTimeRange('23:30', 60)).toBe('23:30 - 00:30');
    });

    it('0分の場合は開始時刻のみ', () => {
      expect(ScheduleEntity.formatTimeRange('12:00', 0)).toBe('12:00');
    });
  });

  describe('getTimeUntilLabel', () => {
    it('0分はまもなくを返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(0)).toBe('まもなく');
    });

    it('30分は30分後を返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(30)).toBe('30分後');
    });

    it('60分は1時間後を返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(60)).toBe('1時間後');
    });

    it('90分は1時間30分後を返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(90)).toBe('1時間30分後');
    });

    it('120分は2時間後を返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(120)).toBe('2時間後');
    });

    it('負の値は過ぎていますを返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(-10)).toBe('予定時刻を過ぎています');
    });
  });

  describe('getDaysOfWeekLabels', () => {
    it('空配列は空配列を返す', () => {
      expect(ScheduleEntity.getDaysOfWeekLabels([])).toEqual([]);
    });

    it('曜日コードを日本語に変換する', () => {
      const days: DayOfWeek[] = ['mon', 'wed', 'fri'];
      expect(ScheduleEntity.getDaysOfWeekLabels(days)).toEqual(['月', '水', '金']);
    });

    it('全曜日を変換できる', () => {
      const days: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      expect(ScheduleEntity.getDaysOfWeekLabels(days)).toEqual(['日', '月', '火', '水', '木', '金', '土']);
    });
  });
});
