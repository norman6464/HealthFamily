import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity 重複検知メッセージ', () => {
  describe('getOverlapSummary', () => {
    it('0件は重複なしメッセージを返す', () => {
      expect(ScheduleEntity.getOverlapSummary(0)).toBe('重複するスケジュールはありません');
    });

    it('1件は単数メッセージを返す', () => {
      expect(ScheduleEntity.getOverlapSummary(1)).toBe('1件の重複があります');
    });

    it('複数件は複数メッセージを返す', () => {
      expect(ScheduleEntity.getOverlapSummary(3)).toBe('3件の重複があります');
    });
  });

  describe('formatOverlapDetail', () => {
    it('時刻と曜日を含むメッセージを返す', () => {
      const result = ScheduleEntity.formatOverlapDetail('08:00', 'mon');
      expect(result).toContain('08:00');
      expect(result).toContain('月');
    });

    it('every曜日は毎日を表示する', () => {
      const result = ScheduleEntity.formatOverlapDetail('12:00', 'every');
      expect(result).toContain('毎日');
    });

    it('各曜日を正しく変換する', () => {
      expect(ScheduleEntity.formatOverlapDetail('09:00', 'sun')).toContain('日');
      expect(ScheduleEntity.formatOverlapDetail('09:00', 'sat')).toContain('土');
    });
  });

  describe('hasAnyOverlap', () => {
    it('空配列はfalseを返す', () => {
      expect(ScheduleEntity.hasAnyOverlap([])).toBe(false);
    });

    it('1件以上はtrueを返す', () => {
      expect(ScheduleEntity.hasAnyOverlap([{ scheduleIds: ['a', 'b'], time: '08:00', day: 'mon' }])).toBe(true);
    });

    it('複数件もtrueを返す', () => {
      const overlaps = [
        { scheduleIds: ['a', 'b'], time: '08:00', day: 'mon' },
        { scheduleIds: ['c', 'd'], time: '12:00', day: 'tue' },
      ];
      expect(ScheduleEntity.hasAnyOverlap(overlaps)).toBe(true);
    });
  });
});
