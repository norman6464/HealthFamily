import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper - Business Days Edge Cases', () => {
  describe('countBusinessDays 境界値', () => {
    it('同一日(月曜)は1営業日', () => {
      const mon = new Date('2025-06-16');
      expect(DateRangeHelper.countBusinessDays(mon, mon)).toBe(1);
    });

    it('同一日(土曜)は0営業日', () => {
      const sat = new Date('2025-06-14');
      expect(DateRangeHelper.countBusinessDays(sat, sat)).toBe(0);
    });

    it('金曜から月曜は2営業日(金・月)', () => {
      const fri = new Date('2025-06-13');
      const mon = new Date('2025-06-16');
      expect(DateRangeHelper.countBusinessDays(fri, mon)).toBe(2);
    });

    it('1週間(月-日)は5営業日', () => {
      const mon = new Date('2025-06-16');
      const sun = new Date('2025-06-22');
      expect(DateRangeHelper.countBusinessDays(mon, sun)).toBe(5);
    });
  });

  describe('addBusinessDays 境界値', () => {
    it('0営業日追加は同じ日', () => {
      const mon = new Date('2025-06-16');
      const result = DateRangeHelper.addBusinessDays(mon, 0);
      expect(result.getDate()).toBe(16);
    });

    it('金曜に1営業日追加は翌月曜', () => {
      const fri = new Date('2025-06-13');
      const result = DateRangeHelper.addBusinessDays(fri, 1);
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getDate()).toBe(16);
    });

    it('5営業日追加で1週間後(土日スキップ)', () => {
      const mon = new Date('2025-06-16');
      const result = DateRangeHelper.addBusinessDays(mon, 5);
      expect(result.getDate()).toBe(23); // 次の月曜
    });
  });

  describe('isBusinessDay 境界値', () => {
    it('金曜は営業日', () => {
      expect(DateRangeHelper.isBusinessDay(new Date('2025-06-13'))).toBe(true);
    });

    it('日曜は非営業日', () => {
      expect(DateRangeHelper.isBusinessDay(new Date('2025-06-15'))).toBe(false);
    });
  });
});
