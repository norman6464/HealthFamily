import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Consecutive Record', () => {
  describe('getConsecutiveRecordDays', () => {
    it('連続記録日数を算出', () => {
      const recordCounts = [1, 2, 3, 0, 1, 1];
      expect(CalendarEntity.getConsecutiveRecordDays(recordCounts)).toBe(3);
    });

    it('全て記録あり', () => {
      const recordCounts = [1, 1, 1, 1, 1];
      expect(CalendarEntity.getConsecutiveRecordDays(recordCounts)).toBe(5);
    });

    it('全て記録なし', () => {
      const recordCounts = [0, 0, 0];
      expect(CalendarEntity.getConsecutiveRecordDays(recordCounts)).toBe(0);
    });

    it('空配列', () => {
      expect(CalendarEntity.getConsecutiveRecordDays([])).toBe(0);
    });

    it('最後に最長連続がある場合', () => {
      const recordCounts = [1, 0, 1, 1, 1, 1];
      expect(CalendarEntity.getConsecutiveRecordDays(recordCounts)).toBe(4);
    });
  });

  describe('getConsecutiveRecordLabel', () => {
    it('0日は記録なし', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(0)).toBe('記録なし');
    });

    it('7日は1週間連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(7)).toBe('1週間連続');
    });

    it('30日は1ヶ月連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(30)).toBe('1ヶ月連続');
    });

    it('3日は3日連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(3)).toBe('3日連続');
    });

    it('14日は2週間連続', () => {
      expect(CalendarEntity.getConsecutiveRecordLabel(14)).toBe('2週間連続');
    });
  });
});
