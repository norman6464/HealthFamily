import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Event Density Analysis', () => {
  describe('getEventDensity', () => {
    it('10日間で5イベントなら0.5を返す', () => {
      expect(CalendarEntity.getEventDensity(5, 10)).toBe(0.5);
    });

    it('0日なら0を返す', () => {
      expect(CalendarEntity.getEventDensity(5, 0)).toBe(0);
    });

    it('0イベントなら0を返す', () => {
      expect(CalendarEntity.getEventDensity(0, 10)).toBe(0);
    });

    it('7日間で14イベントなら2.0を返す', () => {
      expect(CalendarEntity.getEventDensity(14, 7)).toBe(2);
    });
  });

  describe('getBusiestWeekday', () => {
    it('月曜が最多なら「月曜日」を返す', () => {
      const counts = [0, 5, 2, 1, 3, 0, 0];
      expect(CalendarEntity.getBusiestWeekday(counts)).toBe('月曜日');
    });

    it('日曜が最多なら「日曜日」を返す', () => {
      const counts = [10, 0, 0, 0, 0, 0, 0];
      expect(CalendarEntity.getBusiestWeekday(counts)).toBe('日曜日');
    });

    it('土曜が最多なら「土曜日」を返す', () => {
      const counts = [0, 0, 0, 0, 0, 0, 8];
      expect(CalendarEntity.getBusiestWeekday(counts)).toBe('土曜日');
    });

    it('全て同じなら「日曜日」を返す(先頭優先)', () => {
      const counts = [3, 3, 3, 3, 3, 3, 3];
      expect(CalendarEntity.getBusiestWeekday(counts)).toBe('日曜日');
    });

    it('空配列なら「日曜日」を返す', () => {
      expect(CalendarEntity.getBusiestWeekday([])).toBe('日曜日');
    });
  });

  describe('getEventDistributionLabel', () => {
    it('全て均等なら「均等」を返す', () => {
      const counts = [5, 5, 5, 5, 5, 5, 5];
      expect(CalendarEntity.getEventDistributionLabel(counts)).toBe('均等');
    });

    it('偏りがある場合「偏りあり」を返す', () => {
      const counts = [20, 0, 0, 0, 0, 0, 0];
      expect(CalendarEntity.getEventDistributionLabel(counts)).toBe('偏りあり');
    });

    it('やや偏りがある場合「やや偏り」を返す', () => {
      const counts = [10, 5, 5, 5, 5, 5, 0];
      expect(CalendarEntity.getEventDistributionLabel(counts)).toBe('やや偏り');
    });

    it('全て0なら「均等」を返す', () => {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      expect(CalendarEntity.getEventDistributionLabel(counts)).toBe('均等');
    });
  });
});
