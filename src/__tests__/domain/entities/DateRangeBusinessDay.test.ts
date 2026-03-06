import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Business Day', () => {
  describe('isWeekend', () => {
    it('土曜日でtrue', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-07'))).toBe(true);
    });

    it('日曜日でtrue', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-08'))).toBe(true);
    });

    it('月曜日でfalse', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-09'))).toBe(false);
    });

    it('金曜日でfalse', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-06'))).toBe(false);
    });
  });

  describe('countBusinessDays', () => {
    it('月曜から金曜で5営業日', () => {
      const from = new Date('2026-03-09');
      const to = new Date('2026-03-13');
      expect(DateRangeHelper.countBusinessDays(from, to)).toBe(5);
    });

    it('月曜から日曜で5営業日', () => {
      const from = new Date('2026-03-09');
      const to = new Date('2026-03-15');
      expect(DateRangeHelper.countBusinessDays(from, to)).toBe(5);
    });

    it('土曜から日曜で0営業日', () => {
      const from = new Date('2026-03-07');
      const to = new Date('2026-03-08');
      expect(DateRangeHelper.countBusinessDays(from, to)).toBe(0);
    });

    it('同日の平日で1営業日', () => {
      const date = new Date('2026-03-09');
      expect(DateRangeHelper.countBusinessDays(date, date)).toBe(1);
    });

    it('2週間で10営業日', () => {
      const from = new Date('2026-03-09');
      const to = new Date('2026-03-20');
      expect(DateRangeHelper.countBusinessDays(from, to)).toBe(10);
    });
  });

  describe('getBusinessDayLabel', () => {
    it('平日で「営業日」を返す', () => {
      expect(DateRangeHelper.getBusinessDayLabel(new Date('2026-03-09'))).toBe('営業日');
    });

    it('土曜で「休日」を返す', () => {
      expect(DateRangeHelper.getBusinessDayLabel(new Date('2026-03-07'))).toBe('休日');
    });

    it('日曜で「休日」を返す', () => {
      expect(DateRangeHelper.getBusinessDayLabel(new Date('2026-03-08'))).toBe('休日');
    });
  });
});
