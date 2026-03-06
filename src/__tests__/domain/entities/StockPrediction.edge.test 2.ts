import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫予測エッジケース', () => {
  describe('predictStockoutDate 追加境界値', () => {
    it('在庫1・消費1の場合は1日後', () => {
      const result = StockAlertEntity.predictStockoutDate(1, 1, new Date('2026-03-05'));
      expect(result).toBe('2026-03-06');
    });

    it('在庫が消費量より小さい場合は当日', () => {
      const result = StockAlertEntity.predictStockoutDate(1, 3, new Date('2026-03-05'));
      expect(result).toBe('2026-03-05');
    });

    it('大量在庫の場合も正しく計算する', () => {
      const result = StockAlertEntity.predictStockoutDate(365, 1, new Date('2026-01-01'));
      expect(result).toBe('2027-01-01');
    });

    it('小数の消費量も正しく処理する', () => {
      const result = StockAlertEntity.predictStockoutDate(10, 0.5, new Date('2026-03-05'));
      expect(result).toBe('2026-03-25');
    });
  });

  describe('getStockSufficiencyRate 追加境界値', () => {
    it('在庫が必要量ちょうどの場合は100', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(7, 1, 7)).toBe(100);
    });

    it('在庫が必要量の2倍でも100を超えない', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(14, 1, 7)).toBe(100);
    });

    it('消費量が負の場合は100を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(5, -1, 7)).toBe(100);
    });

    it('目標日数が負の場合は100を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(5, 1, -1)).toBe(100);
    });
  });

  describe('getStockSufficiencyLabel 境界値', () => {
    it('ちょうど70は"十分"', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(70)).toBe('十分');
    });

    it('69は"やや不足"', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(69)).toBe('やや不足');
    });

    it('ちょうど40は"やや不足"', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(40)).toBe('やや不足');
    });

    it('39は"不足"', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(39)).toBe('不足');
    });
  });

  describe('calculateRemainingDays 追加テスト', () => {
    it('在庫7・消費2の場合は3日', () => {
      expect(StockAlertEntity.calculateRemainingDays(7, 2)).toBe(3);
    });

    it('在庫1・消費1の場合は1日', () => {
      expect(StockAlertEntity.calculateRemainingDays(1, 1)).toBe(1);
    });

    it('在庫0の場合は0日', () => {
      expect(StockAlertEntity.calculateRemainingDays(0, 1)).toBe(0);
    });
  });
});
