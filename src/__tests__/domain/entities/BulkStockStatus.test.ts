import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Bulk Stock Status', () => {
  describe('getBulkStockStatus', () => {
    it('全て余裕ありは安心', () => {
      const items = [
        { remainingDays: 30 },
        { remainingDays: 20 },
      ];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('安心');
    });

    it('1つでも緊急がある場合は緊急', () => {
      const items = [
        { remainingDays: 30 },
        { remainingDays: 2 },
      ];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('緊急');
    });

    it('注意レベルがある場合は注意', () => {
      const items = [
        { remainingDays: 30 },
        { remainingDays: 5 },
      ];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('注意');
    });

    it('空配列はデータなし', () => {
      expect(StockAlertEntity.getBulkStockStatus([])).toBe('データなし');
    });
  });

  describe('getBulkStockLabel', () => {
    it('緊急は早急に補充が必要です', () => {
      expect(StockAlertEntity.getBulkStockLabel('緊急')).toBe('早急に補充が必要です');
    });

    it('注意はそろそろ補充を検討してください', () => {
      expect(StockAlertEntity.getBulkStockLabel('注意')).toBe('そろそろ補充を検討してください');
    });

    it('安心は在庫に余裕があります', () => {
      expect(StockAlertEntity.getBulkStockLabel('安心')).toBe('在庫に余裕があります');
    });

    it('データなし', () => {
      expect(StockAlertEntity.getBulkStockLabel('データなし')).toBe('在庫データがありません');
    });
  });
});
