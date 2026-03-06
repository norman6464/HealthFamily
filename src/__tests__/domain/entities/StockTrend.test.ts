import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Stock Trend', () => {
  describe('getStockTrend', () => {
    it('空配列はstable', () => {
      expect(StockAlertEntity.getStockTrend([])).toBe('stable');
    });

    it('1件のみはstable', () => {
      expect(StockAlertEntity.getStockTrend([10])).toBe('stable');
    });

    it('増加傾向はincreasing', () => {
      expect(StockAlertEntity.getStockTrend([10, 20, 30, 40])).toBe('increasing');
    });

    it('減少傾向はdecreasing', () => {
      expect(StockAlertEntity.getStockTrend([40, 30, 20, 10])).toBe('decreasing');
    });

    it('横ばいはstable', () => {
      expect(StockAlertEntity.getStockTrend([10, 10, 10, 10])).toBe('stable');
    });

    it('小さな変動はstable', () => {
      expect(StockAlertEntity.getStockTrend([10, 11, 10, 11])).toBe('stable');
    });

    it('前半と後半の平均比較', () => {
      expect(StockAlertEntity.getStockTrend([5, 5, 15, 15])).toBe('increasing');
    });
  });

  describe('getStockTrendLabel', () => {
    it('増加', () => {
      expect(StockAlertEntity.getStockTrendLabel('increasing')).toBe('在庫増加中');
    });

    it('減少', () => {
      expect(StockAlertEntity.getStockTrendLabel('decreasing')).toBe('在庫減少中');
    });

    it('安定', () => {
      expect(StockAlertEntity.getStockTrendLabel('stable')).toBe('在庫安定');
    });
  });
});
