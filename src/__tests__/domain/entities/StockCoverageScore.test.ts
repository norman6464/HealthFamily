import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Stock Coverage Score', () => {
  describe('getStockCoverageScore', () => {
    it('在庫0は0', () => {
      expect(StockAlertEntity.getStockCoverageScore(0, 1)).toBe(0);
    });

    it('日消費0は100', () => {
      expect(StockAlertEntity.getStockCoverageScore(10, 0)).toBe(100);
    });

    it('30日分ちょうどは100', () => {
      expect(StockAlertEntity.getStockCoverageScore(30, 1)).toBe(100);
    });

    it('15日分は50', () => {
      expect(StockAlertEntity.getStockCoverageScore(15, 1)).toBe(50);
    });

    it('60日分は100（上限）', () => {
      expect(StockAlertEntity.getStockCoverageScore(60, 1)).toBe(100);
    });

    it('1日分で日消費2', () => {
      expect(StockAlertEntity.getStockCoverageScore(1, 2)).toBe(2);
    });

    it('両方0は100', () => {
      expect(StockAlertEntity.getStockCoverageScore(0, 0)).toBe(100);
    });
  });

  describe('getStockCoverageLabel', () => {
    it('高カバレッジ', () => {
      expect(StockAlertEntity.getStockCoverageLabel(80)).toBe('十分');
    });

    it('中カバレッジ', () => {
      expect(StockAlertEntity.getStockCoverageLabel(50)).toBe('やや不足');
    });

    it('低カバレッジ', () => {
      expect(StockAlertEntity.getStockCoverageLabel(20)).toBe('不足');
    });
  });
});
