import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Wastage Analysis', () => {
  describe('getWastageRate', () => {
    it('全量消費で廃棄率0%', () => {
      expect(StockAlertEntity.getWastageRate(100, 100)).toBe(0);
    });

    it('半分廃棄で50%', () => {
      expect(StockAlertEntity.getWastageRate(50, 100)).toBe(50);
    });

    it('全廃棄で100%', () => {
      expect(StockAlertEntity.getWastageRate(0, 100)).toBe(100);
    });

    it('購入量0はnull', () => {
      expect(StockAlertEntity.getWastageRate(50, 0)).toBeNull();
    });

    it('消費量が購入量を超えた場合は0%', () => {
      expect(StockAlertEntity.getWastageRate(120, 100)).toBe(0);
    });
  });

  describe('getWastageLabel', () => {
    it('5%以下は効率的', () => {
      expect(StockAlertEntity.getWastageLabel(5)).toBe('効率的');
    });

    it('10%は許容範囲', () => {
      expect(StockAlertEntity.getWastageLabel(10)).toBe('許容範囲');
    });

    it('20%は要改善', () => {
      expect(StockAlertEntity.getWastageLabel(20)).toBe('要改善');
    });

    it('30%は非効率', () => {
      expect(StockAlertEntity.getWastageLabel(30)).toBe('非効率');
    });

    it('nullはデータなし', () => {
      expect(StockAlertEntity.getWastageLabel(null)).toBe('データなし');
    });
  });
});
