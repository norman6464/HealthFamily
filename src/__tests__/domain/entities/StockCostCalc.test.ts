import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫コスト計算', () => {
  describe('estimateRefillCost', () => {
    it('必要量と単価からコストを算出する', () => {
      expect(StockAlertEntity.estimateRefillCost(30, 50)).toBe(1500);
    });

    it('必要量が0ならコストは0', () => {
      expect(StockAlertEntity.estimateRefillCost(0, 50)).toBe(0);
    });

    it('単価が0ならコストは0', () => {
      expect(StockAlertEntity.estimateRefillCost(30, 0)).toBe(0);
    });

    it('負の必要量は0を返す', () => {
      expect(StockAlertEntity.estimateRefillCost(-5, 50)).toBe(0);
    });

    it('小数を含む場合は切り上げる', () => {
      expect(StockAlertEntity.estimateRefillCost(3, 33)).toBe(99);
    });
  });

  describe('getMonthlyConsumptionCost', () => {
    it('日消費量と単価から月間コストを算出する', () => {
      // 1日2個 x 30日 x 10円 = 600円
      expect(StockAlertEntity.getMonthlyConsumptionCost(2, 10)).toBe(600);
    });

    it('日消費量が0なら0を返す', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(0, 10)).toBe(0);
    });

    it('単価が0なら0を返す', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(2, 0)).toBe(0);
    });

    it('小数の日消費量でも計算できる', () => {
      // 0.5 x 30 x 100 = 1500
      expect(StockAlertEntity.getMonthlyConsumptionCost(0.5, 100)).toBe(1500);
    });

    it('負の日消費量は0を返す', () => {
      expect(StockAlertEntity.getMonthlyConsumptionCost(-1, 10)).toBe(0);
    });
  });

  describe('getCostEfficiencyLabel', () => {
    it('月間コストが1000円未満は低コスト', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(500)).toBe('低コスト');
    });

    it('月間コストが1000円以上5000円未満は標準', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(3000)).toBe('標準');
    });

    it('月間コストが5000円以上10000円未満はやや高額', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(7000)).toBe('やや高額');
    });

    it('月間コストが10000円以上は高額', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(15000)).toBe('高額');
    });

    it('0円は低コスト', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(0)).toBe('低コスト');
    });
  });
});
