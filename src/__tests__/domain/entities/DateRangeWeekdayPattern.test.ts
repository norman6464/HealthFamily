import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Weekday Pattern', () => {
  describe('getWeekdayDistribution', () => {
    it('7日間で各曜日1回ずつを返す', () => {
      const from = new Date('2026-03-02'); // 月曜日
      const to = new Date('2026-03-08');   // 日曜日
      const result = DateRangeHelper.getWeekdayDistribution(from, to);
      expect(result).toEqual([1, 1, 1, 1, 1, 1, 1]);
    });

    it('14日間で各曜日2回ずつを返す', () => {
      const from = new Date('2026-03-02');
      const to = new Date('2026-03-15');
      const result = DateRangeHelper.getWeekdayDistribution(from, to);
      expect(result).toEqual([2, 2, 2, 2, 2, 2, 2]);
    });

    it('1日間で該当曜日のみ1を返す', () => {
      const date = new Date('2026-03-05'); // 木曜日
      const result = DateRangeHelper.getWeekdayDistribution(date, date);
      expect(result[4]).toBe(1); // 木曜
      expect(result.reduce((a, b) => a + b, 0)).toBe(1);
    });

    it('同一日で合計1を返す', () => {
      const date = new Date('2026-03-01'); // 日曜日
      const result = DateRangeHelper.getWeekdayDistribution(date, date);
      expect(result[0]).toBe(1);
    });
  });

  describe('isSameWeek', () => {
    it('同じ週の月曜と金曜でtrueを返す', () => {
      const mon = new Date('2026-03-02');
      const fri = new Date('2026-03-06');
      expect(DateRangeHelper.isSameWeek(mon, fri)).toBe(true);
    });

    it('異なる週でfalseを返す', () => {
      const fri = new Date('2026-03-06');
      const nextMon = new Date('2026-03-09');
      expect(DateRangeHelper.isSameWeek(fri, nextMon)).toBe(false);
    });

    it('同一日でtrueを返す', () => {
      const date = new Date('2026-03-05');
      expect(DateRangeHelper.isSameWeek(date, date)).toBe(true);
    });

    it('日曜と土曜（同じ週）でtrueを返す', () => {
      const sun = new Date('2026-03-01'); // 日曜
      const sat = new Date('2026-03-07'); // 土曜
      expect(DateRangeHelper.isSameWeek(sun, sat)).toBe(true);
    });
  });

  describe('getWeekRange', () => {
    it('水曜日の週の開始（日曜）と終了（土曜）を返す', () => {
      const wed = new Date('2026-03-04');
      const { start, end } = DateRangeHelper.getWeekRange(wed);
      expect(start.getDay()).toBe(0); // 日曜
      expect(end.getDay()).toBe(6);   // 土曜
      expect(start.getDate()).toBe(1);
      expect(end.getDate()).toBe(7);
    });

    it('日曜日はその日が開始日', () => {
      const sun = new Date('2026-03-01');
      const { start } = DateRangeHelper.getWeekRange(sun);
      expect(start.getDate()).toBe(1);
    });

    it('土曜日はその日が終了日', () => {
      const sat = new Date('2026-03-07');
      const { end } = DateRangeHelper.getWeekRange(sat);
      expect(end.getDate()).toBe(7);
    });
  });
});
