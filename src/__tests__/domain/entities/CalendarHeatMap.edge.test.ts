import { CalendarEntity } from '@/domain/entities/Calendar';

describe('CalendarEntity - Heat Map Edge Cases', () => {
  describe('getHeatMapIntensity', () => {
    it('countが負の場合は0', () => {
      expect(CalendarEntity.getHeatMapIntensity(-1, 10)).toBe(0);
    });

    it('maxCountが負の場合は0', () => {
      expect(CalendarEntity.getHeatMapIntensity(5, -1)).toBe(0);
    });

    it('countがmaxCountを超える場合は4', () => {
      expect(CalendarEntity.getHeatMapIntensity(15, 10)).toBe(4);
    });

    it('75%ちょうどは3', () => {
      expect(CalendarEntity.getHeatMapIntensity(75, 100)).toBe(3);
    });

    it('50%ちょうどは2', () => {
      expect(CalendarEntity.getHeatMapIntensity(50, 100)).toBe(2);
    });

    it('1%は1', () => {
      expect(CalendarEntity.getHeatMapIntensity(1, 100)).toBe(1);
    });
  });

  describe('getHeatMapColor', () => {
    it('範囲外の強度はbg-gray-100', () => {
      expect(CalendarEntity.getHeatMapColor(5)).toBe('bg-gray-100');
    });

    it('負の強度はbg-gray-100', () => {
      expect(CalendarEntity.getHeatMapColor(-1)).toBe('bg-gray-100');
    });
  });
});
