import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Business Day Edge Cases', () => {
  describe('isWeekend', () => {
    it('水曜日でfalse', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-11'))).toBe(false);
    });
  });

  describe('countBusinessDays', () => {
    it('同日の土曜で0', () => {
      const sat = new Date('2026-03-07');
      expect(DateRangeHelper.countBusinessDays(sat, sat)).toBe(0);
    });

    it('金曜から月曜で2営業日', () => {
      const fri = new Date('2026-03-06');
      const mon = new Date('2026-03-09');
      expect(DateRangeHelper.countBusinessDays(fri, mon)).toBe(2);
    });

    it('1ヶ月で約22営業日', () => {
      const from = new Date('2026-03-01');
      const to = new Date('2026-03-31');
      const result = DateRangeHelper.countBusinessDays(from, to);
      expect(result).toBeGreaterThanOrEqual(21);
      expect(result).toBeLessThanOrEqual(23);
    });
  });

  describe('getBusinessDayLabel', () => {
    it('木曜で「営業日」', () => {
      expect(DateRangeHelper.getBusinessDayLabel(new Date('2026-03-12'))).toBe('営業日');
    });
  });
});
