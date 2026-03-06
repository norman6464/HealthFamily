import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Consecutive Record Edge Cases', () => {
  describe('getConsecutiveRecordDays', () => {
    it('1要素で記録あり', () => {
      expect(CalendarEntity.getConsecutiveRecordDays([1])).toBe(1);
    });

    it('1要素で記録なし', () => {
      expect(CalendarEntity.getConsecutiveRecordDays([0])).toBe(0);
    });

    it('先頭と末尾に0がある場合', () => {
      expect(CalendarEntity.getConsecutiveRecordDays([0, 1, 1, 1, 0])).toBe(3);
    });

    it('複数の同じ長さの連続がある場合', () => {
      expect(CalendarEntity.getConsecutiveRecordDays([1, 1, 0, 1, 1])).toBe(2);
    });

    it('大きな値も記録ありとして扱う', () => {
      expect(CalendarEntity.getConsecutiveRecordDays([10, 20, 30])).toBe(3);
    });

    it('交互の記録', () => {
      expect(CalendarEntity.getConsecutiveRecordDays([1, 0, 1, 0, 1])).toBe(1);
    });

    it('長い配列の最長連続', () => {
      const arr = [0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0];
      expect(CalendarEntity.getConsecutiveRecordDays(arr)).toBe(5);
    });
  });

  describe('getConsecutiveRecordLabel', () => {
    it('1日連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(1)).toBe('1日連続');
    });

    it('21日は3週間連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(21)).toBe('3週間連続');
    });

    it('60日は2ヶ月連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(60)).toBe('2ヶ月連続');
    });

    it('28日は4週間連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(28)).toBe('4週間連続');
    });

    it('35日は5週間連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(35)).toBe('5週間連続');
    });

    it('90日は3ヶ月連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(90)).toBe('3ヶ月連続');
    });
  });
});
