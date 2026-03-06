import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity 重複検知メッセージ エッジケース', () => {
  describe('formatOverlapDetail', () => {
    it('全曜日のラベルを正しく変換する', () => {
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
      const labels = ['月', '火', '水', '木', '金', '土', '日'];
      days.forEach((day, i) => {
        expect(ScheduleEntity.formatOverlapDetail('10:00', day)).toContain(labels[i]);
      });
    });
  });

  describe('getOverlapSummary', () => {
    it('大きな件数でも正しいメッセージを返す', () => {
      expect(ScheduleEntity.getOverlapSummary(100)).toBe('100件の重複があります');
    });
  });
});
