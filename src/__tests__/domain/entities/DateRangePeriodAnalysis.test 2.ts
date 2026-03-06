import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper 期間分析ユーティリティ', () => {
  describe('getDatesBetween', () => {
    it('同日の場合は1要素を返す', () => {
      const from = new Date('2026-03-01');
      const to = new Date('2026-03-01');
      expect(DateRangeHelper.getDatesBetween(from, to)).toEqual(['2026-03-01']);
    });

    it('連続3日間の日付キーを返す', () => {
      const from = new Date('2026-03-01');
      const to = new Date('2026-03-03');
      expect(DateRangeHelper.getDatesBetween(from, to)).toEqual([
        '2026-03-01',
        '2026-03-02',
        '2026-03-03',
      ]);
    });

    it('月をまたぐ場合も正しく返す', () => {
      const from = new Date('2026-02-27');
      const to = new Date('2026-03-02');
      expect(DateRangeHelper.getDatesBetween(from, to)).toEqual([
        '2026-02-27',
        '2026-02-28',
        '2026-03-01',
        '2026-03-02',
      ]);
    });

    it('fromがtoより後の場合は空配列を返す', () => {
      const from = new Date('2026-03-05');
      const to = new Date('2026-03-01');
      expect(DateRangeHelper.getDatesBetween(from, to)).toEqual([]);
    });
  });

  describe('getDayOfWeekLabel', () => {
    it('日曜日は"日"を返す', () => {
      expect(DateRangeHelper.getDayOfWeekLabel(new Date('2026-03-01'))).toBe('日');
    });

    it('月曜日は"月"を返す', () => {
      expect(DateRangeHelper.getDayOfWeekLabel(new Date('2026-03-02'))).toBe('月');
    });

    it('土曜日は"土"を返す', () => {
      expect(DateRangeHelper.getDayOfWeekLabel(new Date('2026-03-07'))).toBe('土');
    });
  });

  describe('isWeekend', () => {
    it('土曜日はtrueを返す', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-07'))).toBe(true);
    });

    it('日曜日はtrueを返す', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-01'))).toBe(true);
    });

    it('月曜日はfalseを返す', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-02'))).toBe(false);
    });

    it('金曜日はfalseを返す', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-06'))).toBe(false);
    });
  });

  describe('getWeekNumber', () => {
    it('1月1日は第1週を返す', () => {
      expect(DateRangeHelper.getWeekNumber(new Date('2026-01-01'))).toBe(1);
    });

    it('1月8日は第2週を返す', () => {
      expect(DateRangeHelper.getWeekNumber(new Date('2026-01-08'))).toBe(2);
    });

    it('12月31日は正しい週番号を返す', () => {
      const week = DateRangeHelper.getWeekNumber(new Date('2026-12-31'));
      expect(week).toBeGreaterThanOrEqual(52);
      expect(week).toBeLessThanOrEqual(53);
    });
  });
});
