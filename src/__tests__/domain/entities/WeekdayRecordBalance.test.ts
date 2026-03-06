import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Weekday Record Balance', () => {
  describe('getWeekdayRecordBalance', () => {
    it('空配列は0/0', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([]);
      expect(result).toEqual({ weekdayRate: 0, weekendRate: 0 });
    });

    it('平日のみ(月-金)は平日100/休日0', () => {
      // 0=日,1=月,...,6=土 → 平日: 1-5
      const result = CalendarEntity.getWeekdayRecordBalance([1, 2, 3, 4, 5]);
      expect(result.weekdayRate).toBe(100);
      expect(result.weekendRate).toBe(0);
    });

    it('休日のみ(土日)は平日0/休日100', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([0, 6]);
      expect(result.weekdayRate).toBe(0);
      expect(result.weekendRate).toBe(100);
    });

    it('均等な場合', () => {
      // 5平日+2休日=7
      const result = CalendarEntity.getWeekdayRecordBalance([0, 1, 2, 3, 4, 5, 6]);
      expect(result.weekdayRate).toBe(71);
      expect(result.weekendRate).toBe(29);
    });

    it('重複する曜日も個別にカウント', () => {
      const result = CalendarEntity.getWeekdayRecordBalance([1, 1, 1]);
      expect(result.weekdayRate).toBe(100);
      expect(result.weekendRate).toBe(0);
    });
  });

  describe('getWeekdayBalanceLabel', () => {
    it('バランスが取れている', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(60, 40)).toBe('バランス良好');
    });

    it('平日偏り', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(90, 10)).toBe('平日に偏り');
    });

    it('休日偏り', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(20, 80)).toBe('休日に偏り');
    });

    it('両方0', () => {
      expect(CalendarEntity.getWeekdayBalanceLabel(0, 0)).toBe('データ不足');
    });
  });
});
