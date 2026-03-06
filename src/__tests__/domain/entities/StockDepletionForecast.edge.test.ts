import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Depletion Forecast Edge Cases', () => {
  describe('getDepletionDays', () => {
    it('負の在庫', () => {
      expect(StockAlertEntity.getDepletionDays(-5, 2)).toBe(-3);
    });

    it('消費率が負はnull', () => {
      expect(StockAlertEntity.getDepletionDays(30, -1)).toBeNull();
    });

    it('大量在庫', () => {
      expect(StockAlertEntity.getDepletionDays(1000, 10)).toBe(100);
    });

    it('小数の消費率', () => {
      expect(StockAlertEntity.getDepletionDays(10, 3)).toBe(3);
    });
  });

  describe('getDepletionUrgencyLabel', () => {
    it('0日は緊急', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(0)).toBe('緊急');
    });

    it('3日は緊急', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(3)).toBe('緊急');
    });

    it('4日は注意', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(4)).toBe('注意');
    });

    it('7日は注意', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(7)).toBe('注意');
    });

    it('8日はやや余裕', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(8)).toBe('やや余裕');
    });

    it('14日はやや余裕', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(14)).toBe('やや余裕');
    });

    it('15日は余裕あり', () => {
      expect(StockAlertEntity.getDepletionUrgencyLabel(15)).toBe('余裕あり');
    });
  });
});
