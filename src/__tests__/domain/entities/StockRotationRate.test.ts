import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity - Stock Rotation Rate', () => {
  describe('getStockRotationRate', () => {
    it('消費0は0', () => {
      expect(StockAlertEntity.getStockRotationRate(0, 100)).toBe(0);
    });

    it('平均在庫0はnull', () => {
      expect(StockAlertEntity.getStockRotationRate(100, 0)).toBeNull();
    });

    it('消費100/在庫50は2.0', () => {
      expect(StockAlertEntity.getStockRotationRate(100, 50)).toBe(2);
    });

    it('消費50/在庫100は0.5', () => {
      expect(StockAlertEntity.getStockRotationRate(50, 100)).toBe(0.5);
    });

    it('消費と在庫が同じは1.0', () => {
      expect(StockAlertEntity.getStockRotationRate(100, 100)).toBe(1);
    });

    it('小数点第2位で丸められる', () => {
      expect(StockAlertEntity.getStockRotationRate(100, 30)).toBe(3.33);
    });

    it('両方0はnull', () => {
      expect(StockAlertEntity.getStockRotationRate(0, 0)).toBeNull();
    });

    it('負の消費量は0', () => {
      expect(StockAlertEntity.getStockRotationRate(-10, 50)).toBe(0);
    });

    it('負の平均在庫はnull', () => {
      expect(StockAlertEntity.getStockRotationRate(100, -10)).toBeNull();
    });
  });

  describe('getStockRotationLabel', () => {
    it('nullはデータなし', () => {
      expect(StockAlertEntity.getStockRotationLabel(null)).toBe('データなし');
    });

    it('高回転', () => {
      expect(StockAlertEntity.getStockRotationLabel(3)).toBe('高回転');
    });

    it('適正回転', () => {
      expect(StockAlertEntity.getStockRotationLabel(1.5)).toBe('適正');
    });

    it('低回転', () => {
      expect(StockAlertEntity.getStockRotationLabel(0.3)).toBe('低回転');
    });
  });
});
