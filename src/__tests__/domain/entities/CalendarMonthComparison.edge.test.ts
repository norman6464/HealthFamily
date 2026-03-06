import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity 月間比較 エッジケース', () => {
  describe('getMonthComparisonMessage', () => {
    it('差が5%ちょうどは維持を返す', () => {
      const msg = CalendarEntity.getMonthComparisonMessage(75, 70);
      expect(msg).toContain('維持');
    });

    it('差が6%は改善を返す', () => {
      const msg = CalendarEntity.getMonthComparisonMessage(76, 70);
      expect(msg).toContain('改善');
    });
  });

  describe('getRecordDensity', () => {
    it('境界値80%は高を返す', () => {
      expect(CalendarEntity.getRecordDensity(80)).toBe('高');
    });

    it('境界値79%は中を返す', () => {
      expect(CalendarEntity.getRecordDensity(79)).toBe('中');
    });

    it('境界値50%は中を返す', () => {
      expect(CalendarEntity.getRecordDensity(50)).toBe('中');
    });

    it('境界値49%は低を返す', () => {
      expect(CalendarEntity.getRecordDensity(49)).toBe('低');
    });
  });

  describe('getMonthlyRecordSummary', () => {
    it('1日中1日記録は完璧メッセージを返す', () => {
      expect(CalendarEntity.getMonthlyRecordSummary(1, 1)).toBe('毎日記録がつけられています');
    });

    it('28日の2月でも正しく表示する', () => {
      const msg = CalendarEntity.getMonthlyRecordSummary(20, 28);
      expect(msg).toContain('28');
      expect(msg).toContain('20');
    });
  });
});
