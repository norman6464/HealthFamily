import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockEfficiencyScore エッジケーステスト', () => {
  describe('getStockEfficiencyScore', () => {
    it('両方0の場合0を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(0, 0)).toBe(0);
    });

    it('消費量0・在庫正の場合0を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(0, 100)).toBe(0);
    });

    it('消費量正・在庫0の場合0を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(50, 0)).toBe(0);
    });

    it('消費量が在庫と等しい場合100を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(100, 100)).toBe(100);
    });

    it('消費量が在庫を大きく超える場合100を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(500, 100)).toBe(100);
    });

    it('消費量1・在庫100の場合1を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(1, 100)).toBe(1);
    });

    it('負の消費量の場合0を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(-10, 100)).toBe(0);
    });

    it('負の在庫の場合0を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(50, -10)).toBe(0);
    });

    it('小数値で正しく四捨五入する', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(33, 100)).toBe(33);
    });

    it('2/3の場合67を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyScore(2, 3)).toBe(67);
    });
  });

  describe('getStockEfficiencyLabel', () => {
    it('境界値: 80は効率的を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyLabel(80)).toBe('効率的');
    });

    it('境界値: 79は標準を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyLabel(79)).toBe('標準');
    });

    it('境界値: 50は標準を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyLabel(50)).toBe('標準');
    });

    it('境界値: 49は非効率を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyLabel(49)).toBe('非効率');
    });

    it('100は効率的を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyLabel(100)).toBe('効率的');
    });

    it('0は非効率を返す', () => {
      expect(StockAlertEntity.getStockEfficiencyLabel(0)).toBe('非効率');
    });
  });
});
