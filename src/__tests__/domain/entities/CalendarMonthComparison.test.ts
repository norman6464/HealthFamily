import { describe, it, expect } from 'vitest';
import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity 月間比較分析', () => {
  describe('getMonthComparisonMessage', () => {
    it('改善時は改善メッセージを返す', () => {
      const msg = CalendarEntity.getMonthComparisonMessage(80, 60);
      expect(msg).toContain('改善');
    });

    it('悪化時は低下メッセージを返す', () => {
      const msg = CalendarEntity.getMonthComparisonMessage(40, 70);
      expect(msg).toContain('低下');
    });

    it('差5%以内は維持メッセージを返す', () => {
      const msg = CalendarEntity.getMonthComparisonMessage(73, 70);
      expect(msg).toContain('維持');
    });

    it('同値は維持メッセージを返す', () => {
      const msg = CalendarEntity.getMonthComparisonMessage(80, 80);
      expect(msg).toContain('維持');
    });
  });

  describe('getRecordDensity', () => {
    it('80%以上は高密度を返す', () => {
      expect(CalendarEntity.getRecordDensity(85)).toBe('高');
    });

    it('50%以上は中密度を返す', () => {
      expect(CalendarEntity.getRecordDensity(60)).toBe('中');
    });

    it('50%未満は低密度を返す', () => {
      expect(CalendarEntity.getRecordDensity(30)).toBe('低');
    });

    it('0%は低密度を返す', () => {
      expect(CalendarEntity.getRecordDensity(0)).toBe('低');
    });

    it('100%は高密度を返す', () => {
      expect(CalendarEntity.getRecordDensity(100)).toBe('高');
    });
  });

  describe('getMonthlyRecordSummary', () => {
    it('記録なしの場合はなしメッセージを返す', () => {
      expect(CalendarEntity.getMonthlyRecordSummary(0, 30)).toBe('今月の記録はありません');
    });

    it('全日記録ありの場合は完璧メッセージを返す', () => {
      expect(CalendarEntity.getMonthlyRecordSummary(30, 30)).toBe('毎日記録がつけられています');
    });

    it('一部記録ありの場合は日数を含むメッセージを返す', () => {
      const msg = CalendarEntity.getMonthlyRecordSummary(15, 30);
      expect(msg).toContain('15');
      expect(msg).toContain('30');
    });

    it('totalDays 0は記録なしメッセージを返す', () => {
      expect(CalendarEntity.getMonthlyRecordSummary(0, 0)).toBe('今月の記録はありません');
    });
  });
});
