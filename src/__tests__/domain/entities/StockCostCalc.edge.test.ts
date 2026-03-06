import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockCostCalc エッジケース', () => {
  describe('estimateRefillCost', () => {
    it('極大値でも計算できる', () => {
      expect(StockAlertEntity.estimateRefillCost(10000, 100)).toBe(1000000);
    });

    it('小数の単価で切り上げされる', () => {
      // 3 * 33.3 = 99.9 → 切り上げ100
      expect(StockAlertEntity.estimateRefillCost(3, 33.3)).toBe(100);
    });

    it('両方負の場合は0を返す', () => {
      expect(StockAlertEntity.estimateRefillCost(-1, -1)).toBe(0);
    });
  });

  describe('getMonthlyConsumptionCost', () => {
    it('極小消費量でも計算できる', () => {
      // 0.1 * 30 * 50 = 150
      expect(StockAlertEntity.getMonthlyConsumptionCost(0.1, 50)).toBe(150);
    });

    it('大量消費の場合', () => {
      // 10 * 30 * 1000 = 300000
      expect(StockAlertEntity.getMonthlyConsumptionCost(10, 1000)).toBe(300000);
    });
  });

  describe('getCostEfficiencyLabel', () => {
    it('999円は低コスト（境界値）', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(999)).toBe('低コスト');
    });

    it('1000円は標準（境界値）', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(1000)).toBe('標準');
    });

    it('4999円は標準（境界値）', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(4999)).toBe('標準');
    });

    it('5000円はやや高額（境界値）', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(5000)).toBe('やや高額');
    });

    it('10000円は高額（境界値）', () => {
      expect(StockAlertEntity.getCostEfficiencyLabel(10000)).toBe('高額');
    });
  });
});
