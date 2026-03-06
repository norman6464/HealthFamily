import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Stock Rotation Rate Edge Cases', () => {
  describe('getStockRotationRate', () => {
    it('非常に大きな消費量', () => {
      expect(StockAlertEntity.getStockRotationRate(1000000, 100)).toBe(10000);
    });

    it('非常に小さな平均在庫', () => {
      expect(StockAlertEntity.getStockRotationRate(100, 0.01)).toBe(10000);
    });

    it('消費と在庫が小数', () => {
      expect(StockAlertEntity.getStockRotationRate(1.5, 0.5)).toBe(3);
    });

    it('消費0で平均在庫が正', () => {
      expect(StockAlertEntity.getStockRotationRate(0, 50)).toBe(0);
    });

    it('平均在庫がちょうど0はnull', () => {
      expect(StockAlertEntity.getStockRotationRate(50, 0)).toBeNull();
    });

    it('両方が非常に大きい値', () => {
      expect(StockAlertEntity.getStockRotationRate(999999, 999999)).toBe(1);
    });

    it('丸め処理の確認', () => {
      expect(StockAlertEntity.getStockRotationRate(1, 3)).toBe(0.33);
    });

    it('丸め処理2', () => {
      expect(StockAlertEntity.getStockRotationRate(2, 3)).toBe(0.67);
    });
  });

  describe('getStockRotationLabel', () => {
    it('ちょうど2.0は高回転', () => {
      expect(StockAlertEntity.getStockRotationLabel(2)).toBe('高回転');
    });

    it('1.99は適正', () => {
      expect(StockAlertEntity.getStockRotationLabel(1.99)).toBe('適正');
    });

    it('ちょうど1.0は適正', () => {
      expect(StockAlertEntity.getStockRotationLabel(1)).toBe('適正');
    });

    it('0.99は低回転', () => {
      expect(StockAlertEntity.getStockRotationLabel(0.99)).toBe('低回転');
    });

    it('0は低回転', () => {
      expect(StockAlertEntity.getStockRotationLabel(0)).toBe('低回転');
    });

    it('非常に高い回転率', () => {
      expect(StockAlertEntity.getStockRotationLabel(100)).toBe('高回転');
    });
  });
});
