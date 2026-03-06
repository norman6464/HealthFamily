import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Record Gap Days', () => {
  describe('getRecordGapDays', () => {
    it('空配列は0', () => {
      expect(CalendarEntity.getRecordGapDays([])).toBe(0);
    });

    it('連続日付は0', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-01-02', '2026-01-03'])).toBe(0);
    });

    it('1日の空白', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-01-03'])).toBe(1);
    });

    it('複数の空白', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-01-05'])).toBe(3);
    });

    it('1件のみは0', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01'])).toBe(0);
    });

    it('順序が不正でも正しくソートされる', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-05', '2026-01-01'])).toBe(3);
    });

    it('重複日付は無視', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-01-01', '2026-01-03'])).toBe(1);
    });

    it('長期間の空白', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-02-01'])).toBe(30);
    });
  });

  describe('getRecordGapLabel', () => {
    it('0日は連続記録', () => {
      expect(CalendarEntity.getRecordGapLabel(0)).toBe('連続記録');
    });

    it('2日は短い空白', () => {
      expect(CalendarEntity.getRecordGapLabel(2)).toBe('短い空白');
    });

    it('7日は長い空白', () => {
      expect(CalendarEntity.getRecordGapLabel(7)).toBe('長い空白');
    });

    it('14日以上は記録途絶', () => {
      expect(CalendarEntity.getRecordGapLabel(14)).toBe('記録途絶');
    });
  });
});
