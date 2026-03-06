import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockConsumptionTrend エッジケース', () => {
  describe('getConsumptionRate エッジケース', () => {
    it('1日1消費は1を返す', () => {
      expect(StockAlertEntity.getConsumptionRate(1, 1)).toBe(1);
    });

    it('大きな消費量と日数', () => {
      expect(StockAlertEntity.getConsumptionRate(1000, 365)).toBe(2.74);
    });

    it('割り切れる場合は整数を返す', () => {
      expect(StockAlertEntity.getConsumptionRate(100, 10)).toBe(10);
    });
  });

  describe('getConsumptionTrend エッジケース', () => {
    it('前期0で現在正の値はincreasingを返す', () => {
      expect(StockAlertEntity.getConsumptionTrend(5, 0)).toBe('increasing');
    });

    it('前期10で現在9はstableを返す（10%以内）', () => {
      expect(StockAlertEntity.getConsumptionTrend(9, 10)).toBe('stable');
    });

    it('前期10で現在8はdecreasingを返す（20%減）', () => {
      expect(StockAlertEntity.getConsumptionTrend(8, 10)).toBe('decreasing');
    });

    it('前期10で現在11はstableを返す（10%以内）', () => {
      expect(StockAlertEntity.getConsumptionTrend(11, 10)).toBe('stable');
    });

    it('前期10で現在12はincreasingを返す（20%増）', () => {
      expect(StockAlertEntity.getConsumptionTrend(12, 10)).toBe('increasing');
    });
  });

  describe('getOptimalOrderQuantity エッジケース', () => {
    it('在庫が目標量と一致する場合は0を返す', () => {
      expect(StockAlertEntity.getOptimalOrderQuantity(2, 30, 60)).toBe(0);
    });

    it('在庫が目標量を超える場合は0を返す', () => {
      expect(StockAlertEntity.getOptimalOrderQuantity(2, 30, 100)).toBe(0);
    });

    it('小数の消費量は切り上げる', () => {
      expect(StockAlertEntity.getOptimalOrderQuantity(1.5, 10, 0)).toBe(15);
    });
  });
});
