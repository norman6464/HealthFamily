import { describe, it, expect } from 'vitest';
import { CalendarEntity, CalendarDay } from '@/domain/entities/Calendar';

const createDay = (date: string, recordCount: number = 0, isCurrentMonth: boolean = true): CalendarDay => ({
  date: new Date(date),
  isCurrentMonth,
  isToday: false,
  recordCount,
});

describe('CalendarEntity 月間統計エッジケース', () => {
  describe('getMonthlyRecordRate 追加テスト', () => {
    it('1日だけ記録ありの31日間', () => {
      const days = Array.from({ length: 31 }, (_, i) =>
        createDay(`2026-03-${String(i + 1).padStart(2, '0')}`, i === 0 ? 1 : 0),
      );
      const rate = CalendarEntity.getMonthlyRecordRate(days);
      expect(rate).toBe(3); // 1/31 = 3.2% → 3
    });

    it('全て前月の日は0を返す', () => {
      const days = [
        createDay('2026-02-28', 1, false),
        createDay('2026-02-27', 1, false),
      ];
      expect(CalendarEntity.getMonthlyRecordRate(days)).toBe(0);
    });
  });

  describe('getActiveWeeks 追加テスト', () => {
    it('同じ週の複数日は1を返す', () => {
      const days = [
        createDay('2026-03-02', 1), // 月
        createDay('2026-03-03', 1), // 火
        createDay('2026-03-04', 1), // 水
      ];
      expect(CalendarEntity.getActiveWeeks(days)).toBe(1);
    });

    it('4週間全てに記録ありは4を返す', () => {
      const days = [
        createDay('2026-03-02', 1),
        createDay('2026-03-09', 1),
        createDay('2026-03-16', 1),
        createDay('2026-03-23', 1),
      ];
      expect(CalendarEntity.getActiveWeeks(days)).toBe(4);
    });
  });
});
