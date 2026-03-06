import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Cost Analysis Edge Cases', () => {
  describe('getCostCategory', () => {
    it('境界値999はlow', () => {
      expect(StockAlertEntity.getCostCategory(999)).toBe('low');
    });

    it('境界値1000はstandard', () => {
      expect(StockAlertEntity.getCostCategory(1000)).toBe('standard');
    });

    it('境界値4999はstandard', () => {
      expect(StockAlertEntity.getCostCategory(4999)).toBe('standard');
    });

    it('境界値5000はmoderate', () => {
      expect(StockAlertEntity.getCostCategory(5000)).toBe('moderate');
    });

    it('境界値9999はmoderate', () => {
      expect(StockAlertEntity.getCostCategory(9999)).toBe('moderate');
    });

    it('境界値10000はhigh', () => {
      expect(StockAlertEntity.getCostCategory(10000)).toBe('high');
    });

    it('0はlow', () => {
      expect(StockAlertEntity.getCostCategory(0)).toBe('low');
    });

    it('負の値はlow', () => {
      expect(StockAlertEntity.getCostCategory(-100)).toBe('low');
    });
  });

  describe('getStockValueSummary', () => {
    it('大量アイテムの合計', () => {
      const items = Array.from({ length: 100 }, () => ({ stockQuantity: 10, unitPrice: 50 }));
      const result = StockAlertEntity.getStockValueSummary(items);
      expect(result.totalValue).toBe(50000);
      expect(result.itemCount).toBe(100);
    });

    it('小数単価の場合', () => {
      const items = [{ stockQuantity: 3, unitPrice: 33.33 }];
      const result = StockAlertEntity.getStockValueSummary(items);
      expect(result.totalValue).toBeCloseTo(99.99, 2);
    });

    it('単価0のアイテム', () => {
      const items = [{ stockQuantity: 100, unitPrice: 0 }];
      const result = StockAlertEntity.getStockValueSummary(items);
      expect(result.totalValue).toBe(0);
    });
  });

  describe('getMonthlyConsumptionCost', () => {
    it('小数の消費量', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(0.5, 100)).toBe(1500);
    });

    it('負の消費量は0', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(-1, 100)).toBe(0);
    });

    it('負の単価は0', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(2, -50)).toBe(0);
    });
  });
});
