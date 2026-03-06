import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Refill Recommendation Edge Cases', () => {
  describe('getRefillRecommendation', () => {
    it('1件のみ', () => {
      const items = [{ name: '薬A', remainingDays: 5 }];
      const result = StockAlertEntity.getRefillRecommendation(items);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('薬A');
    });

    it('残り0日が最優先', () => {
      const items = [
        { name: '薬A', remainingDays: 10 },
        { name: '薬B', remainingDays: 0 },
      ];
      const result = StockAlertEntity.getRefillRecommendation(items);
      expect(result[0].name).toBe('薬B');
    });

    it('元の配列を変更しない', () => {
      const items = [
        { name: '薬A', remainingDays: 10 },
        { name: '薬B', remainingDays: 1 },
      ];
      StockAlertEntity.getRefillRecommendation(items);
      expect(items[0].name).toBe('薬A');
    });
  });

  describe('getRefillPriorityLabel', () => {
    it('0は最優先ではない(低優先)', () => {
      expect(StockAlertEntity.getRefillPriorityLabel(0)).toBe('低優先');
    });

    it('5は低優先', () => {
      expect(StockAlertEntity.getRefillPriorityLabel(5)).toBe('低優先');
    });

    it('100は低優先', () => {
      expect(StockAlertEntity.getRefillPriorityLabel(100)).toBe('低優先');
    });
  });
});
