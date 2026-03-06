import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockCoverageScore エッジケーステスト', () => {
  describe('getStockCoverageScore', () => {
    it('在庫0・消費量正の場合0を返す', () => {
      expect(StockAlertEntity.getStockCoverageScore(0, 1)).toBe(0);
    });

    it('消費量0の場合100を返す', () => {
      expect(StockAlertEntity.getStockCoverageScore(10, 0)).toBe(100);
    });

    it('負の消費量の場合100を返す', () => {
      expect(StockAlertEntity.getStockCoverageScore(10, -1)).toBe(100);
    });

    it('ちょうど30日分で100を返す', () => {
      expect(StockAlertEntity.getStockCoverageScore(30, 1)).toBe(100);
    });

    it('15日分で50を返す', () => {
      expect(StockAlertEntity.getStockCoverageScore(15, 1)).toBe(50);
    });

    it('60日分でも100を超えない', () => {
      expect(StockAlertEntity.getStockCoverageScore(60, 1)).toBe(100);
    });

    it('非常に小さい消費量で大きな在庫の場合100を返す', () => {
      expect(StockAlertEntity.getStockCoverageScore(1000, 0.001)).toBe(100);
    });

    it('小数の在庫と消費量でも正しく計算する', () => {
      const score = StockAlertEntity.getStockCoverageScore(4.5, 0.5);
      expect(score).toBe(30);
    });

    it('在庫1・消費量1の場合3を返す', () => {
      expect(StockAlertEntity.getStockCoverageScore(1, 1)).toBe(3);
    });
  });

  describe('getStockCoverageLabel', () => {
    it('境界値: 70は十分を返す', () => {
      expect(StockAlertEntity.getStockCoverageLabel(70)).toBe('十分');
    });

    it('境界値: 69はやや不足を返す', () => {
      expect(StockAlertEntity.getStockCoverageLabel(69)).toBe('やや不足');
    });

    it('境界値: 40はやや不足を返す', () => {
      expect(StockAlertEntity.getStockCoverageLabel(40)).toBe('やや不足');
    });

    it('境界値: 39は不足を返す', () => {
      expect(StockAlertEntity.getStockCoverageLabel(39)).toBe('不足');
    });

    it('0は不足を返す', () => {
      expect(StockAlertEntity.getStockCoverageLabel(0)).toBe('不足');
    });

    it('100は十分を返す', () => {
      expect(StockAlertEntity.getStockCoverageLabel(100)).toBe('十分');
    });
  });
});
