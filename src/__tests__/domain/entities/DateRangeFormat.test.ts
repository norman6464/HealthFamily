import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper 期間フォーマット', () => {
  describe('formatDateRange', () => {
    it('同月の日付範囲をフォーマットする', () => {
      const start = new Date('2025-06-01');
      const end = new Date('2025-06-30');
      expect(DateRangeHelper.formatDateRange(start, end)).toBe('6月1日〜6月30日');
    });

    it('異月の日付範囲をフォーマットする', () => {
      const start = new Date('2025-01-15');
      const end = new Date('2025-02-14');
      expect(DateRangeHelper.formatDateRange(start, end)).toBe('1月15日〜2月14日');
    });

    it('同日の場合は1日のみ表示する', () => {
      const date = new Date('2025-03-05');
      expect(DateRangeHelper.formatDateRange(date, date)).toBe('3月5日');
    });
  });

  describe('formatRelativeDate', () => {
    const today = new Date('2025-06-15');

    it('今日の日付は今日を返す', () => {
      expect(DateRangeHelper.formatRelativeDate(new Date('2025-06-15'), today)).toBe('今日');
    });

    it('昨日の日付は昨日を返す', () => {
      expect(DateRangeHelper.formatRelativeDate(new Date('2025-06-14'), today)).toBe('昨日');
    });

    it('2日前はN日前を返す', () => {
      expect(DateRangeHelper.formatRelativeDate(new Date('2025-06-13'), today)).toBe('2日前');
    });

    it('7日前は7日前を返す', () => {
      expect(DateRangeHelper.formatRelativeDate(new Date('2025-06-08'), today)).toBe('7日前');
    });

    it('8日以上前は日付を返す', () => {
      const result = DateRangeHelper.formatRelativeDate(new Date('2025-06-01'), today);
      expect(result).toBe('6月1日');
    });

    it('未来の日付は日付を返す', () => {
      const result = DateRangeHelper.formatRelativeDate(new Date('2025-06-20'), today);
      expect(result).toBe('6月20日');
    });
  });

  describe('getDateRangeDescription', () => {
    it('1日間の期間を表示する', () => {
      expect(DateRangeHelper.getDateRangeDescription(1)).toBe('1日間');
    });

    it('7日間は1週間を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(7)).toBe('1週間');
    });

    it('14日間は2週間を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(14)).toBe('2週間');
    });

    it('30日間は1ヶ月を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(30)).toBe('約1ヶ月');
    });

    it('90日間は3ヶ月を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(90)).toBe('約3ヶ月');
    });

    it('365日間は1年を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(365)).toBe('約1年');
    });

    it('10日間はN日間を返す', () => {
      expect(DateRangeHelper.getDateRangeDescription(10)).toBe('10日間');
    });
  });
});
