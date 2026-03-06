import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Record Gap Days Edge Cases', () => {
  describe('getRecordGapDays', () => {
    it('全て同じ日付は0', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-01-01', '2026-01-01'])).toBe(0);
    });

    it('3日連続で空白なし', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-01-02', '2026-01-03'])).toBe(0);
    });

    it('逆順でも正しく算出', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-10', '2026-01-01', '2026-01-05'])).toBe(4);
    });

    it('年をまたぐ', () => {
      expect(CalendarEntity.getRecordGapDays(['2025-12-31', '2026-01-01'])).toBe(0);
    });

    it('月末と月初', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-31', '2026-02-01'])).toBe(0);
    });

    it('複数のギャップがある場合は最大を返す', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-01-01', '2026-01-03', '2026-01-10'])).toBe(6);
    });

    it('2件で隣接', () => {
      expect(CalendarEntity.getRecordGapDays(['2026-03-01', '2026-03-02'])).toBe(0);
    });

    it('大きなギャップ', () => {
      expect(CalendarEntity.getRecordGapDays(['2025-01-01', '2026-01-01'])).toBe(364);
    });
  });

  describe('getRecordGapLabel', () => {
    it('1日は短い空白', () => {
      expect(CalendarEntity.getRecordGapLabel(1)).toBe('短い空白');
    });

    it('2日は短い空白', () => {
      expect(CalendarEntity.getRecordGapLabel(2)).toBe('短い空白');
    });

    it('3日は長い空白（閾値境界）', () => {
      expect(CalendarEntity.getRecordGapLabel(3)).toBe('長い空白');
    });

    it('13日は長い空白', () => {
      expect(CalendarEntity.getRecordGapLabel(13)).toBe('長い空白');
    });

    it('14日は記録途絶（閾値境界）', () => {
      expect(CalendarEntity.getRecordGapLabel(14)).toBe('記録途絶');
    });

    it('100日は記録途絶', () => {
      expect(CalendarEntity.getRecordGapLabel(100)).toBe('記録途絶');
    });
  });
});
