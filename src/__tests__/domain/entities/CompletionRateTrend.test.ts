import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Completion Rate Trend', () => {
  describe('getWeeklyCompletionRates', () => {
    it('7日分のデータを1週に集約', () => {
      const dailyRates = [100, 80, 90, 70, 60, 50, 100];
      const result = AdherenceTrendEntity.getWeeklyCompletionRates(dailyRates);
      expect(result).toHaveLength(1);
      expect(result[0]).toBeCloseTo(78.6, 0);
    });

    it('14日分のデータを2週に集約', () => {
      const dailyRates = [100, 100, 100, 100, 100, 100, 100, 0, 0, 0, 0, 0, 0, 0];
      const result = AdherenceTrendEntity.getWeeklyCompletionRates(dailyRates);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe(100);
      expect(result[1]).toBe(0);
    });

    it('空配列は空配列を返す', () => {
      expect(AdherenceTrendEntity.getWeeklyCompletionRates([])).toEqual([]);
    });

    it('7日未満のデータも1週として集約', () => {
      const dailyRates = [80, 60, 40];
      const result = AdherenceTrendEntity.getWeeklyCompletionRates(dailyRates);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(60);
    });
  });

  describe('getCompletionTrend', () => {
    it('上昇傾向を検出', () => {
      const weeklyRates = [50, 60, 70, 80];
      expect(AdherenceTrendEntity.getCompletionTrend(weeklyRates)).toBe('improving');
    });

    it('下降傾向を検出', () => {
      const weeklyRates = [80, 70, 60, 50];
      expect(AdherenceTrendEntity.getCompletionTrend(weeklyRates)).toBe('declining');
    });

    it('安定を検出', () => {
      const weeklyRates = [70, 72, 68, 71];
      expect(AdherenceTrendEntity.getCompletionTrend(weeklyRates)).toBe('stable');
    });

    it('データ不足はstable', () => {
      expect(AdherenceTrendEntity.getCompletionTrend([])).toBe('stable');
      expect(AdherenceTrendEntity.getCompletionTrend([80])).toBe('stable');
    });
  });

  describe('getCompletionRateLabel', () => {
    it('100%は完璧', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(100)).toBe('完璧');
    });

    it('90%は優秀', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(90)).toBe('優秀');
    });

    it('70%は良好', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(70)).toBe('良好');
    });

    it('50%は要改善', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(50)).toBe('要改善');
    });

    it('30%は不十分', () => {
      expect(AdherenceTrendEntity.getCompletionRateLabel(30)).toBe('不十分');
    });
  });
});
