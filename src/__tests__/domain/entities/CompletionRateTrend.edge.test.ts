import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Completion Rate Trend Edge Cases', () => {
  describe('getWeeklyCompletionRates', () => {
    it('10日分を2週に分割（7+3）', () => {
      const dailyRates = [100, 100, 100, 100, 100, 100, 100, 0, 0, 0];
      const result = AdherenceTrendEntity.getWeeklyCompletionRates(dailyRates);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(100);
      expect(result[1]).toBe(0);
    });

    it('全て0%の場合', () => {
      const dailyRates = new Array(7).fill(0);
      const result = AdherenceTrendEntity.getWeeklyCompletionRates(dailyRates);
      expect(result[0]).toBe(0);
    });

    it('全て100%の場合', () => {
      const dailyRates = new Array(14).fill(100);
      const result = AdherenceTrendEntity.getWeeklyCompletionRates(dailyRates);
      expect(result).toEqual([100, 100]);
    });

    it('1日分のデータ', () => {
      const result = AdherenceTrendEntity.getWeeklyCompletionRates([50]);
      expect(result).toEqual([50]);
    });
  });

  describe('getCompletionTrend', () => {
    it('差がちょうど5はstable', () => {
      expect(AdherenceTrendEntity.getCompletionTrend([50, 55])).toBe('stable');
    });

    it('差が5.1でimproving', () => {
      expect(AdherenceTrendEntity.getCompletionTrend([50, 55.1])).toBe('improving');
    });

    it('差が-5.1でdeclining', () => {
      expect(AdherenceTrendEntity.getCompletionTrend([55.1, 50])).toBe('declining');
    });

    it('中間値は無視して最初と最後だけ比較', () => {
      expect(AdherenceTrendEntity.getCompletionTrend([50, 90, 60])).toBe('improving');
    });
  });

  describe('getCompletionRateLabel', () => {
    it('境界値100で完璧', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(100)).toBe('完璧');
    });

    it('境界値99で優秀', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(99)).toBe('優秀');
    });

    it('境界値89で良好', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(89)).toBe('良好');
    });

    it('境界値69で要改善', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(69)).toBe('要改善');
    });

    it('境界値49で不十分', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(49)).toBe('不十分');
    });

    it('0%で不十分', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(0)).toBe('不十分');
    });
  });
});
