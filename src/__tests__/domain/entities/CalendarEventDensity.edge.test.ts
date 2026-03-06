import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Event Density Edge Cases', () => {
  describe('getEventDensity', () => {
    it('1日1イベントで1.0', () => {
      expect(CalendarEntity.getEventDensity(1, 1)).toBe(1);
    });

    it('小数点2桁に丸める', () => {
      expect(CalendarEntity.getEventDensity(1, 3)).toBe(0.33);
    });

    it('大量イベント', () => {
      expect(CalendarEntity.getEventDensity(100, 1)).toBe(100);
    });
  });

  describe('getBusiestWeekday', () => {
    it('7要素未満の配列', () => {
      const counts = [5, 3];
      expect(CalendarEntity.getBusiestWeekday(counts)).toBe('日曜日');
    });

    it('7要素超の配列でも7曜日内で判定', () => {
      const counts = [0, 0, 0, 0, 0, 0, 0, 100];
      expect(CalendarEntity.getBusiestWeekday(counts)).toBe('日曜日');
    });

    it('最後の要素が最大', () => {
      const counts = [0, 0, 0, 0, 0, 0, 10];
      expect(CalendarEntity.getBusiestWeekday(counts)).toBe('土曜日');
    });
  });

  describe('getEventDistributionLabel', () => {
    it('1要素のみの配列', () => {
      expect(CalendarEntity.getEventDistributionLabel([10])).toBe('均等');
    });

    it('2要素で差が大きい場合', () => {
      const counts = [100, 0];
      expect(CalendarEntity.getEventDistributionLabel(counts)).toBe('偏りあり');
    });

    it('微小な差は均等', () => {
      const counts = [10, 10, 10, 10, 10, 10, 11];
      expect(CalendarEntity.getEventDistributionLabel(counts)).toBe('均等');
    });

    it('中程度の偏り', () => {
      const counts = [15, 5, 5, 5, 5, 5, 5];
      expect(CalendarEntity.getEventDistributionLabel(counts)).toBe('やや偏り');
    });
  });
});
