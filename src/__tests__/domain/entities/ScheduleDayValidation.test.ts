import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity 曜日バリデーション', () => {
  describe('validateDaysOfWeek', () => {
    it('有効な曜日配列は有効と判定する', () => {
      const result = ScheduleEntity.validateDaysOfWeek(['mon', 'tue', 'wed']);
      expect(result.valid).toBe(true);
    });

    it('空配列は有効（毎日を意味する）', () => {
      const result = ScheduleEntity.validateDaysOfWeek([]);
      expect(result.valid).toBe(true);
    });

    it('無効な曜日を含む場合は無効と判定する', () => {
      const result = ScheduleEntity.validateDaysOfWeek(['mon', 'invalid' as never]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('全7曜日は有効', () => {
      const result = ScheduleEntity.validateDaysOfWeek(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']);
      expect(result.valid).toBe(true);
    });
  });

  describe('normalizeDaysOfWeek', () => {
    it('重複を除去する', () => {
      const result = ScheduleEntity.normalizeDaysOfWeek(['mon', 'mon', 'tue']);
      expect(result).toEqual(['mon', 'tue']);
    });

    it('曜日順にソートする', () => {
      const result = ScheduleEntity.normalizeDaysOfWeek(['sat', 'mon', 'sun']);
      expect(result).toEqual(['sun', 'mon', 'sat']);
    });

    it('空配列はそのまま返す', () => {
      const result = ScheduleEntity.normalizeDaysOfWeek([]);
      expect(result).toEqual([]);
    });

    it('既にソート済みの場合はそのまま返す', () => {
      const result = ScheduleEntity.normalizeDaysOfWeek(['sun', 'mon', 'tue']);
      expect(result).toEqual(['sun', 'mon', 'tue']);
    });
  });

  describe('formatDaysOfWeekSummary', () => {
    it('空配列は毎日を返す', () => {
      expect(ScheduleEntity.formatDaysOfWeekSummary([])).toBe('毎日');
    });

    it('全7曜日は毎日を返す', () => {
      expect(ScheduleEntity.formatDaysOfWeekSummary(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])).toBe('毎日');
    });

    it('月〜金は平日を返す', () => {
      expect(ScheduleEntity.formatDaysOfWeekSummary(['mon', 'tue', 'wed', 'thu', 'fri'])).toBe('平日');
    });

    it('土日は週末を返す', () => {
      expect(ScheduleEntity.formatDaysOfWeekSummary(['sat', 'sun'])).toBe('週末');
    });

    it('個別の曜日はラベルをカンマ区切りで返す', () => {
      const result = ScheduleEntity.formatDaysOfWeekSummary(['mon', 'wed', 'fri']);
      expect(result).toBe('月, 水, 金');
    });

    it('1曜日のみの場合はその曜日ラベルを返す', () => {
      expect(ScheduleEntity.formatDaysOfWeekSummary(['tue'])).toBe('火');
    });
  });
});
