import { AdherenceTrendEntity } from '@/domain/entities/AdherenceTrend';

describe('AdherenceTrendEntity - Forecast Edge Cases', () => {
  describe('calculateTrendDirection 境界値', () => {
    it('差が+5の場合はstable', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([50, 55])).toBe('stable');
    });

    it('差が+6の場合はup', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([50, 56])).toBe('up');
    });

    it('差が-5の場合はstable', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([55, 50])).toBe('stable');
    });

    it('差が-6の場合はdown', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([56, 50])).toBe('down');
    });

    it('長い配列でも最初と最後で判定', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([50, 30, 20, 80])).toBe('up');
    });

    it('全て同じ値はstable', () => {
      expect(AdherenceTrendEntity.calculateTrendDirection([70, 70, 70, 70])).toBe('stable');
    });
  });

  describe('predictNextPeriodRate 境界値', () => {
    it('0から0は0を返す', () => {
      expect(AdherenceTrendEntity.predictNextPeriodRate(0, 0)).toBe(0);
    });

    it('100から100は100を返す', () => {
      expect(AdherenceTrendEntity.predictNextPeriodRate(100, 100)).toBe(100);
    });

    it('大きな上昇でも100に制限', () => {
      expect(AdherenceTrendEntity.predictNextPeriodRate(50, 90)).toBe(100);
    });

    it('大きな下降でも0に制限', () => {
      expect(AdherenceTrendEntity.predictNextPeriodRate(50, 10)).toBe(0);
    });
  });

  describe('formatRateChange 境界値', () => {
    it('大きな正の値', () => {
      expect(AdherenceTrendEntity.formatRateChange(100)).toBe('+100%');
    });

    it('大きな負の値', () => {
      expect(AdherenceTrendEntity.formatRateChange(-100)).toBe('-100%');
    });

    it('小数点を含む値', () => {
      expect(AdherenceTrendEntity.formatRateChange(0.5)).toBe('+0.5%');
    });
  });
});
