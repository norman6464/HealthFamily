import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity 曜日バリデーション エッジケース', () => {
  describe('validateDaysOfWeek', () => {
    it('重複した曜日を含む配列も有効', () => {
      const result = ScheduleEntity.validateDaysOfWeek(['mon', 'mon']);
      expect(result.valid).toBe(true);
    });
  });

  describe('normalizeDaysOfWeek', () => {
    it('全7曜日の重複をソート・除去する', () => {
      const result = ScheduleEntity.normalizeDaysOfWeek(['sat', 'sun', 'sat', 'mon', 'fri', 'tue', 'wed', 'thu']);
      expect(result).toEqual(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
    });

    it('1曜日のみの場合はそのまま返す', () => {
      expect(ScheduleEntity.normalizeDaysOfWeek(['wed'])).toEqual(['wed']);
    });
  });

  describe('formatDaysOfWeekSummary', () => {
    it('月水金のみの場合はカンマ区切りで返す', () => {
      expect(ScheduleEntity.formatDaysOfWeekSummary(['mon', 'wed', 'fri'])).toBe('月, 水, 金');
    });

    it('土のみの場合は土を返す', () => {
      expect(ScheduleEntity.formatDaysOfWeekSummary(['sat'])).toBe('土');
    });

    it('平日+土は平日とはみなさない', () => {
      const result = ScheduleEntity.formatDaysOfWeekSummary(['mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
      expect(result).not.toBe('平日');
    });
  });
});
