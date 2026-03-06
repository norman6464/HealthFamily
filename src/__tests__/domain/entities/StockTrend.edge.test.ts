import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Stock Trend Edge Cases', () => {
  describe('getStockTrend', () => {
    it('2件で差が大きいとincreasing', () => {
      expect(StockAlertEntity.getStockTrend([0, 10])).toBe('increasing');
    });

    it('2件で差が大きいとdecreasing', () => {
      expect(StockAlertEntity.getStockTrend([10, 0])).toBe('decreasing');
    });

    it('2件で差が2以下はstable', () => {
      expect(StockAlertEntity.getStockTrend([10, 12])).toBe('stable');
    });

    it('境界値: 差が丁度2はstable', () => {
      expect(StockAlertEntity.getStockTrend([10, 12])).toBe('stable');
    });

    it('境界値: 差が2.1はincreasing', () => {
      expect(StockAlertEntity.getStockTrend([10, 10, 15, 15])).toBe('increasing');
    });

    it('全て0はstable', () => {
      expect(StockAlertEntity.getStockTrend([0, 0, 0, 0])).toBe('stable');
    });

    it('大量データで増加', () => {
      const data = Array.from({ length: 20 }, (_, i) => i * 2);
      expect(StockAlertEntity.getStockTrend(data)).toBe('increasing');
    });

    it('大量データで減少', () => {
      const data = Array.from({ length: 20 }, (_, i) => 40 - i * 2);
      expect(StockAlertEntity.getStockTrend(data)).toBe('decreasing');
    });
  });

  describe('getStockTrendLabel', () => {
    it('不明なトレンドはデフォルト', () => {
      expect(StockAlertEntity.getStockTrendLabel('unknown')).toBe('在庫安定');
    });

    it('空文字はデフォルト', () => {
      expect(StockAlertEntity.getStockTrendLabel('')).toBe('在庫安定');
    });
  });
});
