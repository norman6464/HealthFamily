import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Refill Optimization Edge Cases', () => {
  describe('getOptimalRefillDate', () => {
    it('バッファが残日数を超える場合今日を返す', () => {
      const today = new Date('2026-03-05');
      const result = StockAlertEntity.getOptimalRefillDate(5, 1, today, 10);
      expect(result).toEqual(new Date('2026-03-05'));
    });

    it('残り1錠で1日1錠ならバッファ0で翌日が切れる日', () => {
      const today = new Date('2026-03-05');
      const result = StockAlertEntity.getOptimalRefillDate(1, 1, today, 0);
      expect(result).toEqual(new Date('2026-03-06'));
    });

    it('大量在庫の場合遠い日付を返す', () => {
      const today = new Date('2026-03-05');
      const result = StockAlertEntity.getOptimalRefillDate(365, 1, today, 0);
      expect(result).toEqual(new Date('2027-03-05'));
    });

    it('負の消費率でnullを返す', () => {
      const today = new Date('2026-03-05');
      expect(StockAlertEntity.getOptimalRefillDate(10, -1, today, 3)).toBeNull();
    });
  });

  describe('getRefillQuantitySuggestion', () => {
    it('0日分なら0を返す', () => {
      expect(StockAlertEntity.getRefillQuantitySuggestion(3, 0)).toBe(0);
    });

    it('大量消費の場合', () => {
      expect(StockAlertEntity.getRefillQuantitySuggestion(10, 90)).toBe(900);
    });
  });

  describe('getRefillCostEstimate', () => {
    it('大量購入のコスト', () => {
      expect(StockAlertEntity.getRefillCostEstimate(1000, 50)).toBe(50000);
    });

    it('小数の結果は四捨五入', () => {
      expect(StockAlertEntity.getRefillCostEstimate(7, 33.33)).toBe(233);
    });
  });
});
