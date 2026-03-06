import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Refill Recommendation', () => {
  describe('getRefillRecommendation', () => {
    it('残り少ない順にソートされる', () => {
      const items = [
        { name: '薬A', remainingDays: 30 },
        { name: '薬B', remainingDays: 3 },
        { name: '薬C', remainingDays: 10 },
      ];
      const result = StockAlertEntity.getRefillRecommendation(items);
      expect(result[0].name).toBe('薬B');
      expect(result[1].name).toBe('薬C');
      expect(result[2].name).toBe('薬A');
    });

    it('空配列は空配列', () => {
      expect(StockAlertEntity.getRefillRecommendation([])).toEqual([]);
    });

    it('同じ残日数は順序維持', () => {
      const items = [
        { name: '薬A', remainingDays: 5 },
        { name: '薬B', remainingDays: 5 },
      ];
      const result = StockAlertEntity.getRefillRecommendation(items);
      expect(result[0].name).toBe('薬A');
    });
  });

  describe('getRefillPriorityLabel', () => {
    it('1位は最優先', () => {
      expect(StockAlertEntity.getRefillPriorityLabel(1)).toBe('最優先');
    });

    it('2位は優先', () => {
      expect(StockAlertEntity.getRefillPriorityLabel(2)).toBe('優先');
    });

    it('3位は通常', () => {
      expect(StockAlertEntity.getRefillPriorityLabel(3)).toBe('通常');
    });

    it('4位以降は低優先', () => {
      expect(StockAlertEntity.getRefillPriorityLabel(4)).toBe('低優先');
    });
  });
});
