import { describe, it, expect } from 'vitest';
import { DateRangeHelper } from '@/domain/entities/DateRange';

describe('DateRangeHelper エッジケーステスト', () => {
  describe('toStartOfDay', () => {
    it('時刻が0時0分0秒0ミリ秒にリセットされる', () => {
      const date = new Date('2026-03-05T15:30:45.123');
      const result = DateRangeHelper.toStartOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('元の日付を変更しない', () => {
      const date = new Date('2026-03-05T15:30:00');
      DateRangeHelper.toStartOfDay(date);
      expect(date.getHours()).toBe(15);
    });

    it('既に0時の場合もそのまま返す', () => {
      const date = new Date('2026-03-05T00:00:00.000');
      const result = DateRangeHelper.toStartOfDay(date);
      expect(result.getTime()).toBe(date.getTime());
    });

    it('23:59:59の場合も0時にリセットされる', () => {
      const date = new Date('2026-03-05T23:59:59.999');
      const result = DateRangeHelper.toStartOfDay(date);
      expect(result.getHours()).toBe(0);
      expect(result.getDate()).toBe(5);
    });
  });

  describe('daysAgo 境界値', () => {
    it('0日前は当日を返す', () => {
      const from = new Date('2026-03-05T10:00:00');
      const result = DateRangeHelper.daysAgo(0, from);
      expect(result.getDate()).toBe(5);
      expect(result.getHours()).toBe(0);
    });

    it('月跨ぎ(3月1日の2日前は2月27日)', () => {
      const from = new Date('2026-03-01');
      const result = DateRangeHelper.daysAgo(2, from);
      expect(result.getMonth()).toBe(1); // 2月
      expect(result.getDate()).toBe(27);
    });

    it('年跨ぎ(1月1日の1日前は12月31日)', () => {
      const from = new Date('2026-01-01');
      const result = DateRangeHelper.daysAgo(1, from);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });
  });

  describe('calculateExpectedByDayOfWeek', () => {
    it('空配列は全て0を返す', () => {
      const result = DateRangeHelper.calculateExpectedByDayOfWeek([]);
      expect(result).toEqual([0, 0, 0, 0, 0, 0, 0]);
    });

    it('曜日未設定(空配列)のスケジュールは全曜日+1', () => {
      const result = DateRangeHelper.calculateExpectedByDayOfWeek([{ daysOfWeek: [] }]);
      expect(result).toEqual([1, 1, 1, 1, 1, 1, 1]);
    });

    it('月水金のスケジュールは月水金のみ+1', () => {
      const result = DateRangeHelper.calculateExpectedByDayOfWeek([
        { daysOfWeek: ['mon', 'wed', 'fri'] },
      ]);
      expect(result).toEqual([0, 1, 0, 1, 0, 1, 0]);
    });

    it('複数スケジュールは加算される', () => {
      const result = DateRangeHelper.calculateExpectedByDayOfWeek([
        { daysOfWeek: ['mon'] },
        { daysOfWeek: ['mon', 'tue'] },
        { daysOfWeek: [] },
      ]);
      // 日:1, 月:3, 火:2, 水:1, 木:1, 金:1, 土:1
      expect(result).toEqual([1, 3, 2, 1, 1, 1, 1]);
    });

    it('不正な曜日名は無視される', () => {
      const result = DateRangeHelper.calculateExpectedByDayOfWeek([
        { daysOfWeek: ['mon', 'invalid'] },
      ]);
      expect(result).toEqual([0, 1, 0, 0, 0, 0, 0]);
    });
  });

  describe('toDateKey 境界値', () => {
    it('1月1日のゼロパディング', () => {
      expect(DateRangeHelper.toDateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
    });

    it('12月31日', () => {
      expect(DateRangeHelper.toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    it('10月10日(パディング不要)', () => {
      expect(DateRangeHelper.toDateKey(new Date(2026, 9, 10))).toBe('2026-10-10');
    });
  });

  describe('diffDays 追加境界値', () => {
    it('同日は0を返す', () => {
      const d = new Date('2026-03-05');
      expect(DateRangeHelper.diffDays(d, d)).toBe(0);
    });

    it('逆順は負の値を返す', () => {
      expect(DateRangeHelper.diffDays(new Date('2026-03-06'), new Date('2026-03-05'))).toBe(-1);
    });

    it('月をまたぐ2月28日→3月1日は1日', () => {
      expect(DateRangeHelper.diffDays(new Date('2026-02-28'), new Date('2026-03-01'))).toBe(1);
    });

    it('年をまたぐ12月31日→1月1日は1日', () => {
      expect(DateRangeHelper.diffDays(new Date('2025-12-31'), new Date('2026-01-01'))).toBe(1);
    });
  });

  describe('isWithinDays 境界値', () => {
    it('ちょうどdays日はtrueを返す', () => {
      expect(DateRangeHelper.isWithinDays(new Date('2026-03-10'), new Date('2026-03-05'), 5)).toBe(true);
    });

    it('days+1日はfalseを返す', () => {
      expect(DateRangeHelper.isWithinDays(new Date('2026-03-11'), new Date('2026-03-05'), 5)).toBe(false);
    });

    it('過去方向もtrueを返す', () => {
      expect(DateRangeHelper.isWithinDays(new Date('2026-03-01'), new Date('2026-03-05'), 5)).toBe(true);
    });
  });

  describe('getDatesBetween 追加テスト', () => {
    it('7日間は7要素を返す', () => {
      const result = DateRangeHelper.getDatesBetween(new Date('2026-03-01'), new Date('2026-03-07'));
      expect(result).toHaveLength(7);
    });

    it('年をまたぐ場合も正しく生成する', () => {
      const result = DateRangeHelper.getDatesBetween(new Date('2025-12-30'), new Date('2026-01-02'));
      expect(result).toEqual(['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']);
    });
  });

  describe('getDayLabels', () => {
    it('7要素の配列を返す', () => {
      expect(DateRangeHelper.getDayLabels()).toHaveLength(7);
    });

    it('日〜土の順序で返す', () => {
      expect(DateRangeHelper.getDayLabels()).toEqual(['日', '月', '火', '水', '木', '金', '土']);
    });

    it('返り値は元配列のコピーである', () => {
      const a = DateRangeHelper.getDayLabels();
      const b = DateRangeHelper.getDayLabels();
      expect(a).not.toBe(b);
    });
  });

  describe('isWeekend 全曜日', () => {
    it('月〜金はfalse', () => {
      for (let i = 2; i <= 6; i++) {
        const d = new Date(`2026-03-0${i}`);
        expect(DateRangeHelper.isWeekend(d)).toBe(false);
      }
    });

    it('土日はtrue', () => {
      expect(DateRangeHelper.isWeekend(new Date('2026-03-07'))).toBe(true);
      expect(DateRangeHelper.isWeekend(new Date('2026-03-01'))).toBe(true);
    });
  });

  describe('daysAgo 追加テスト', () => {
    it('負の日数は未来の日付を返す', () => {
      const from = new Date('2026-03-05');
      const result = DateRangeHelper.daysAgo(-3, from);
      expect(DateRangeHelper.toDateKey(result)).toBe('2026-03-08');
    });
  });
});
