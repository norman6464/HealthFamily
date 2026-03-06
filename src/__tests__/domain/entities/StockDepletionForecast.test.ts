import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Depletion Forecast', () => {
  describe('getDepletionDays', () => {
    it('在庫と消費率から枯渇日数を算出', () => {
      expect(StockAlertEntity.getDepletionDays(30, 3)).toBe(10);
    });

    it('消費率0はnull', () => {
      expect(StockAlertEntity.getDepletionDays(30, 0)).toBeNull();
    });

    it('在庫0は0日', () => {
      expect(StockAlertEntity.getDepletionDays(0, 3)).toBe(0);
    });

    it('小数の結果は切り捨て', () => {
      expect(StockAlertEntity.getDepletionDays(10, 3)).toBe(3);
    });
  });

  describe('getDepletionUrgencyLabel', () => {
    it('3日以内は緊急', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(2)).toBe('緊急');
    });

    it('7日以内は注意', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(5)).toBe('注意');
    });

    it('14日以内はやや余裕', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(10)).toBe('やや余裕');
    });

    it('15日以上は余裕あり', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(20)).toBe('余裕あり');
    });

    it('nullはデータなし', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(null)).toBe('データなし');
    });
  });
});
