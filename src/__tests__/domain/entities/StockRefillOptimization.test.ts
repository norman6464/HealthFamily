import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Refill Optimization', () => {
  describe('getOptimalRefillDate', () => {
    it('1日1錠で残り10錠なら7日後が補充推奨日', () => {
      const today = new Date('2026-03-05');
      const result = StockAlertEntity.getOptimalRefillDate(10, 1, today, 3);
      expect(result).toEqual(new Date('2026-03-12'));
    });

    it('1日2錠で残り20錠なら7日後が補充推奨日', () => {
      const today = new Date('2026-03-05');
      const result = StockAlertEntity.getOptimalRefillDate(20, 2, today, 3);
      expect(result).toEqual(new Date('2026-03-12'));
    });

    it('残り0錠なら今日が補充推奨日', () => {
      const today = new Date('2026-03-05');
      const result = StockAlertEntity.getOptimalRefillDate(0, 1, today, 3);
      expect(result).toEqual(new Date('2026-03-05'));
    });

    it('消費率0なら補充不要でnullを返す', () => {
      const today = new Date('2026-03-05');
      const result = StockAlertEntity.getOptimalRefillDate(10, 0, today, 3);
      expect(result).toBeNull();
    });
  });

  describe('getRefillQuantitySuggestion', () => {
    it('1日1錠で30日分なら30を返す', () => {
      expect(StockAlertEntity.getRefillQuantitySuggestion(1, 30)).toBe(30);
    });

    it('1日3錠で14日分なら42を返す', () => {
      expect(StockAlertEntity.getRefillQuantitySuggestion(3, 14)).toBe(42);
    });

    it('消費率0なら0を返す', () => {
      expect(StockAlertEntity.getRefillQuantitySuggestion(0, 30)).toBe(0);
    });

    it('小数点の消費率で切り上げ', () => {
      expect(StockAlertEntity.getRefillQuantitySuggestion(1.5, 10)).toBe(15);
    });
  });

  describe('getRefillCostEstimate', () => {
    it('単価100円で30錠なら3000円', () => {
      expect(StockAlertEntity.getRefillCostEstimate(30, 100)).toBe(3000);
    });

    it('0錠なら0円', () => {
      expect(StockAlertEntity.getRefillCostEstimate(0, 100)).toBe(0);
    });

    it('単価0円なら0円', () => {
      expect(StockAlertEntity.getRefillCostEstimate(30, 0)).toBe(0);
    });

    it('小数点結果は四捨五入', () => {
      expect(StockAlertEntity.getRefillCostEstimate(3, 33.3)).toBe(100);
    });
  });
});
