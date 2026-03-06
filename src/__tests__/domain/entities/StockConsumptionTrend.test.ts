import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫消費トレンド分析', () => {
  describe('getConsumptionRate', () => {
    it('消費量と日数から1日あたりの消費量を返す', () => {
      expect(StockAlertEntity.getConsumptionRate(30, 10)).toBe(3);
    });

    it('日数0はnullを返す', () => {
      expect(StockAlertEntity.getConsumptionRate(30, 0)).toBeNull();
    });

    it('消費量0は0を返す', () => {
      expect(StockAlertEntity.getConsumptionRate(0, 10)).toBe(0);
    });

    it('小数点以下は2桁に丸める', () => {
      expect(StockAlertEntity.getConsumptionRate(10, 3)).toBe(3.33);
    });

    it('負の日数はnullを返す', () => {
      expect(StockAlertEntity.getConsumptionRate(10, -1)).toBeNull();
    });
  });

  describe('getConsumptionTrend', () => {
    it('現在の消費量が前期より多い場合increasingを返す', () => {
      expect(StockAlertEntity.getConsumptionTrend(5, 3)).toBe('increasing');
    });

    it('現在の消費量が前期より少ない場合decreasingを返す', () => {
      expect(StockAlertEntity.getConsumptionTrend(2, 4)).toBe('decreasing');
    });

    it('同じ消費量はstableを返す', () => {
      expect(StockAlertEntity.getConsumptionTrend(3, 3)).toBe('stable');
    });

    it('10%以内の差はstableを返す', () => {
      expect(StockAlertEntity.getConsumptionTrend(3.0, 3.2)).toBe('stable');
    });

    it('前期0で現在0はstableを返す', () => {
      expect(StockAlertEntity.getConsumptionTrend(0, 0)).toBe('stable');
    });
  });

  describe('getOptimalOrderQuantity', () => {
    it('目標日数と消費量から発注量を返す', () => {
      expect(StockAlertEntity.getOptimalOrderQuantity(2, 30, 10)).toBe(50);
    });

    it('在庫が十分な場合は0を返す', () => {
      expect(StockAlertEntity.getOptimalOrderQuantity(2, 30, 100)).toBe(0);
    });

    it('消費量0は0を返す', () => {
      expect(StockAlertEntity.getOptimalOrderQuantity(0, 30, 5)).toBe(0);
    });

    it('目標日数0は現在の在庫不足分を返す', () => {
      expect(StockAlertEntity.getOptimalOrderQuantity(2, 0, 0)).toBe(0);
    });
  });
});
