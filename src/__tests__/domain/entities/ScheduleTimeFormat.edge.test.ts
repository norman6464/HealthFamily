import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleTimeFormat エッジケース', () => {
  describe('formatTimeRange エッジケース', () => {
    it('深夜0時開始', () => {
      expect(ScheduleEntity.formatTimeRange('00:00', 15)).toBe('00:00 - 00:15');
    });

    it('120分（2時間）の範囲', () => {
      expect(ScheduleEntity.formatTimeRange('10:00', 120)).toBe('10:00 - 12:00');
    });
  });

  describe('getTimeUntilLabel エッジケース', () => {
    it('1分は1分後を返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(1)).toBe('1分後');
    });

    it('59分は59分後を返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(59)).toBe('59分後');
    });

    it('大きな値も正しく表示', () => {
      expect(ScheduleEntity.getTimeUntilLabel(180)).toBe('3時間後');
    });

    it('-1分は過ぎていますを返す', () => {
      expect(ScheduleEntity.getTimeUntilLabel(-1)).toBe('予定時刻を過ぎています');
    });
  });
});
