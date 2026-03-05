import { describe, it, expect } from 'vitest';
import { ScheduleEntity } from '@/domain/entities/Schedule';

describe('ScheduleEntity 完了サマリー', () => {
  describe('calculateCompletionRate', () => {
    it('全て完了で100を返す', () => {
      expect(ScheduleEntity.calculateCompletionRate(5, 5)).toBe(100);
    });

    it('0件完了で0を返す', () => {
      expect(ScheduleEntity.calculateCompletionRate(0, 5)).toBe(0);
    });

    it('総数0で0を返す', () => {
      expect(ScheduleEntity.calculateCompletionRate(0, 0)).toBe(0);
    });

    it('半分完了で50を返す', () => {
      expect(ScheduleEntity.calculateCompletionRate(3, 6)).toBe(50);
    });

    it('端数は四捨五入する', () => {
      expect(ScheduleEntity.calculateCompletionRate(1, 3)).toBe(33);
    });
  });

  describe('getCompletionMessage', () => {
    it('100%で全て完了メッセージ', () => {
      expect(ScheduleEntity.getCompletionMessage(100)).toBe('全ての予定が完了しました');
    });

    it('80%以上であと少しメッセージ', () => {
      expect(ScheduleEntity.getCompletionMessage(80)).toBe('あと少しで全て完了です');
    });

    it('50%以上で順調メッセージ', () => {
      expect(ScheduleEntity.getCompletionMessage(50)).toBe('順調に進んでいます');
    });

    it('50%未満で頑張りましょうメッセージ', () => {
      expect(ScheduleEntity.getCompletionMessage(49)).toBe('今日も頑張りましょう');
    });

    it('0%で頑張りましょうメッセージ', () => {
      expect(ScheduleEntity.getCompletionMessage(0)).toBe('今日も頑張りましょう');
    });

    it('79%は順調メッセージ(境界)', () => {
      expect(ScheduleEntity.getCompletionMessage(79)).toBe('順調に進んでいます');
    });
  });
});
