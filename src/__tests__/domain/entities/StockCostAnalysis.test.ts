import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Cost Analysis', () => {
  describe('getMonthlyConsumptionCost', () => {
    it('日消費2個x単価100円=月6000円', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(2, 100)).toBe(6000);
    });

    it('消費量0は0円', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(0, 100)).toBe(0);
    });

    it('単価0は0円', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(2, 0)).toBe(0);
    });
  });

  describe('getCostCategory', () => {
    it('1000円未満は低コスト', () => {
      expect(StockAlertEntity.getCostCategory(500)).toBe('low');
    });

    it('1000-4999円は標準', () => {
      expect(StockAlertEntity.getCostCategory(3000)).toBe('standard');
    });

    it('5000-9999円はやや高額', () => {
      expect(StockAlertEntity.getCostCategory(7000)).toBe('moderate');
    });

    it('10000円以上は高額', () => {
      expect(StockAlertEntity.getCostCategory(15000)).toBe('high');
    });
  });

  describe('getStockValueSummary', () => {
    it('複数薬の在庫総額を算出', () => {
      const items = [
        { stockQuantity: 30, unitPrice: 100 },
        { stockQuantity: 10, unitPrice: 500 },
      ];
      const result = StockAlertEntity.getStockValueSummary(items);
      expect(result.totalValue).toBe(8000);
      expect(result.itemCount).toBe(2);
    });

    it('空配列は0', () => {
      const result = StockAlertEntity.getStockValueSummary([]);
      expect(result.totalValue).toBe(0);
      expect(result.itemCount).toBe(0);
    });

    it('在庫0の薬は値が0', () => {
      const items = [{ stockQuantity: 0, unitPrice: 100 }];
      const result = StockAlertEntity.getStockValueSummary(items);
      expect(result.totalValue).toBe(0);
    });
  });
});
