import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Forecast', () => {
  describe('calculateTrendDirection', () => {
    it('遵守率が上昇傾向の場合upを返す', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([50, 60, 70])).toBe('up');
    });

    it('遵守率が下降傾向の場合downを返す', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([80, 70, 60])).toBe('down');
    });

    it('遵守率が安定している場合stableを返す', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([70, 72, 68])).toBe('stable');
    });

    it('2値で上昇', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([50, 70])).toBe('up');
    });

    it('2値で下降', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([70, 50])).toBe('down');
    });

    it('1値はstable', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([70])).toBe('stable');
    });

    it('空配列はstable', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([])).toBe('stable');
    });
  });

  describe('predictNextPeriodRate', () => {
    it('上昇傾向から次期間を予測する', () => {
      const result = AdherenceTrendEntity.predictNextPeriodRate(60, 70);
      expect(result).toBe(80);
    });

    it('下降傾向から次期間を予測する', () => {
      const result = AdherenceTrendEntity.predictNextPeriodRate(70, 60);
      expect(result).toBe(50);
    });

    it('100を超える場合は100に制限する', () => {
      const result = AdherenceTrendEntity.predictNextPeriodRate(90, 95);
      expect(result).toBe(100);
    });

    it('0を下回る場合は0に制限する', () => {
      const result = AdherenceTrendEntity.predictNextPeriodRate(10, 3);
      expect(result).toBe(0);
    });

    it('変化なしの場合は同じ値を返す', () => {
      const result = AdherenceTrendEntity.predictNextPeriodRate(70, 70);
      expect(result).toBe(70);
    });
  });

  describe('getTrendSummaryMessage', () => {
    it('上昇トレンドのメッセージ', () => {
      expect(AdherenceTrendEntity.getTrendSummaryMessage('up')).toBe('服薬率が改善傾向にあります');
    });

    it('下降トレンドのメッセージ', () => {
      expect(AdherenceTrendEntity.getTrendSummaryMessage('down')).toBe('服薬率が低下傾向にあります');
    });

    it('安定トレンドのメッセージ', () => {
      expect(AdherenceTrendEntity.getTrendSummaryMessage('stable')).toBe('服薬率は安定しています');
    });
  });
});
