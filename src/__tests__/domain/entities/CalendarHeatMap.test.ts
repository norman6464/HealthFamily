import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Heat Map', () => {
  describe('getHeatMapIntensity', () => {
    it('0は0', () => {
      expect(CalendarEntity.getHeatMapIntensity(0, 10)).toBe(0);
    });

    it('最大値と同じは4', () => {
      expect(CalendarEntity.getHeatMapIntensity(10, 10)).toBe(4);
    });

    it('半分は2', () => {
      expect(CalendarEntity.getHeatMapIntensity(5, 10)).toBe(2);
    });

    it('最大値0の場合は0', () => {
      expect(CalendarEntity.getHeatMapIntensity(5, 0)).toBe(0);
    });

    it('25%は1', () => {
      expect(CalendarEntity.getHeatMapIntensity(1, 4)).toBe(1);
    });
  });

  describe('getHeatMapColor', () => {
    it('0はbg-gray-100', () => {
      expect(CalendarEntity.getHeatMapColor(0)).toBe('bg-gray-100');
    });

    it('1はbg-green-100', () => {
      expect(CalendarEntity.getHeatMapColor(1)).toBe('bg-green-100');
    });

    it('2はbg-green-200', () => {
      expect(CalendarEntity.getHeatMapColor(2)).toBe('bg-green-200');
    });

    it('3はbg-green-300', () => {
      expect(CalendarEntity.getHeatMapColor(3)).toBe('bg-green-300');
    });

    it('4はbg-green-400', () => {
      expect(CalendarEntity.getHeatMapColor(4)).toBe('bg-green-400');
    });
  });
});
