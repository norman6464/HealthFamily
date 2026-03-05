import { describe, it, expect } from 'vitest';
import { ScheduleEntity, ScheduleStatus } from '@/domain/entities/Schedule';

describe('ScheduleEntity 日別完了率サマリー', () => {
  describe('getDailyCompletionSummary', () => {
    it('空配列はゼロサマリーを返す', () => {
      const result = ScheduleEntity.getDailyCompletionSummary([]);
      expect(result.completed).toBe(0);
      expect(result.pending).toBe(0);
      expect(result.overdue).toBe(0);
      expect(result.total).toBe(0);
      expect(result.rate).toBe(0);
    });

    it('全完了の場合', () => {
      const statuses: ScheduleStatus[] = ['completed', 'completed', 'completed'];
      const result = ScheduleEntity.getDailyCompletionSummary(statuses);
      expect(result.completed).toBe(3);
      expect(result.pending).toBe(0);
      expect(result.overdue).toBe(0);
      expect(result.total).toBe(3);
      expect(result.rate).toBe(100);
    });

    it('混合の場合', () => {
      const statuses: ScheduleStatus[] = ['completed', 'pending', 'overdue', 'completed'];
      const result = ScheduleEntity.getDailyCompletionSummary(statuses);
      expect(result.completed).toBe(2);
      expect(result.pending).toBe(1);
      expect(result.overdue).toBe(1);
      expect(result.total).toBe(4);
      expect(result.rate).toBe(50);
    });

    it('全未完了の場合は0%', () => {
      const statuses: ScheduleStatus[] = ['pending', 'overdue'];
      const result = ScheduleEntity.getDailyCompletionSummary(statuses);
      expect(result.completed).toBe(0);
      expect(result.rate).toBe(0);
    });
  });

  describe('getProgressMessage', () => {
    it('完了0件で合計0は「予定がありません」を返す', () => {
      expect(ScheduleEntity.getProgressMessage(0, 0)).toBe('予定がありません');
    });

    it('全完了は達成メッセージを返す', () => {
      expect(ScheduleEntity.getProgressMessage(5, 5)).toBe('全ての予定を達成しました');
    });

    it('半分以上完了は応援メッセージを返す', () => {
      expect(ScheduleEntity.getProgressMessage(3, 5)).toBe('もう少しで全て完了です');
    });

    it('半分未満完了は進行中メッセージを返す', () => {
      expect(ScheduleEntity.getProgressMessage(1, 5)).toBe('少しずつ進めていきましょう');
    });

    it('0件完了で合計ありは開始メッセージを返す', () => {
      expect(ScheduleEntity.getProgressMessage(0, 3)).toBe('少しずつ進めていきましょう');
    });
  });
});
