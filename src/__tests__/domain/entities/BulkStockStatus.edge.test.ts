import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Bulk Stock Status Edge Cases', () => {
  describe('getBulkStockStatus', () => {
    it('残り3日ちょうどは緊急', () => {
      const items = [{ remainingDays: 3 }];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('緊急');
    });

    it('残り4日は注意', () => {
      const items = [{ remainingDays: 4 }];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('注意');
    });

    it('残り7日ちょうどは注意', () => {
      const items = [{ remainingDays: 7 }];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('注意');
    });

    it('残り8日は安心', () => {
      const items = [{ remainingDays: 8 }];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('安心');
    });

    it('複数薬で最小が緊急', () => {
      const items = [
        { remainingDays: 100 },
        { remainingDays: 50 },
        { remainingDays: 1 },
      ];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('緊急');
    });

    it('残り0日は緊急', () => {
      const items = [{ remainingDays: 0 }];
      expect(StockAlertEntity.getBulkStockStatus(items)).toBe('緊急');
    });
  });

  describe('getBulkStockLabel', () => {
    it('不明なステータスはデータなし扱い', () => {
      expect(StockAlertEntity.getBulkStockLabel('不明')).toBe('在庫データがありません');
    });
  });
});
