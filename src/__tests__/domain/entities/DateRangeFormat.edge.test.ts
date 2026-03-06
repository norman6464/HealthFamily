import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper 期間フォーマット エッジケース', () => {
  describe('formatDateRange', () => {
    it('年をまたぐ範囲をフォーマットする', () => {
      const start = new Date('2025-12-25');
      const end = new Date('2026-01-05');
      expect(DateRangeHelper.formatDateRange(start, end)).toBe('12月25日〜1月5日');
    });

    it('1月1日同士は1日だけ表示する', () => {
      const date = new Date('2025-01-01');
      expect(DateRangeHelper.formatDateRange(date, date)).toBe('1月1日');
    });
  });

  describe('formatRelativeDate', () => {
    const today = new Date('2025-06-15');

    it('1日前は昨日を返す', () => {
      expect(DateRangeHelper.formatRelativeDate(new Date('2025-06-14'), today)).toBe('昨日');
    });

    it('ちょうど7日前は7日前を返す', () => {
      expect(DateRangeHelper.formatRelativeDate(new Date('2025-06-08'), today)).toBe('7日前');
    });
  });

  describe('getDateRangeDescription', () => {
    it('2日間は2日間を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(2)).toBe('2日間');
    });

    it('21日間は3週間を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(21)).toBe('3週間');
    });

    it('60日間は約2ヶ月を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(60)).toBe('約2ヶ月');
    });

    it('730日間は約2年を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(730)).toBe('約2年');
    });
  });
});
