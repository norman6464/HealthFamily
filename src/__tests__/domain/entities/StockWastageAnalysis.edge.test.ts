import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Wastage Analysis Edge Cases', () => {
  describe('getWastageRate', () => {
    it('消費量と購入量が同じで0%', () => {
      expect(StockAlertEntity.getWastageRate(50, 50)).toBe(0);
    });

    it('1個消費/100個購入で99%', () => {
      expect(StockAlertEntity.getWastageRate(1, 100)).toBe(99);
    });

    it('0個消費/1個購入で100%', () => {
      expect(StockAlertEntity.getWastageRate(0, 1)).toBe(100);
    });

    it('負の購入量はnull', () => {
      expect(StockAlertEntity.getWastageRate(10, -5)).toBeNull();
    });

    it('負の消費量は正の廃棄率', () => {
      const result = StockAlertEntity.getWastageRate(-10, 100);
      expect(result).toBeGreaterThan(100);
    });
  });

  describe('getWastageLabel', () => {
    it('境界値5で効率的', () => {
      expect(StockAlertEntity.getWastageLabel(5)).toBe('効率的');
    });

    it('境界値6で許容範囲', () => {
      expect(StockAlertEntity.getWastageLabel(6)).toBe('許容範囲');
    });

    it('境界値15で許容範囲', () => {
      expect(StockAlertEntity.getWastageLabel(15)).toBe('許容範囲');
    });

    it('境界値16で要改善', () => {
      expect(StockAlertEntity.getWastageLabel(16)).toBe('要改善');
    });

    it('境界値25で要改善', () => {
      expect(StockAlertEntity.getWastageLabel(25)).toBe('要改善');
    });

    it('境界値26で非効率', () => {
      expect(StockAlertEntity.getWastageLabel(26)).toBe('非効率');
    });

    it('0で効率的', () => {
      expect(StockAlertEntity.getWastageLabel(0)).toBe('効率的');
    });
  });
});
