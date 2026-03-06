import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫予測・充足率分析', () => {
  describe('predictStockoutDate', () => {
    it('在庫10・1日消費2の場合は5日後を返す', () => {
      const baseDate = new Date('2026-03-05');
      const result = StockAlertEntity.predictStockoutDate(10, 2, baseDate);
      expect(result).toBe('2026-03-10');
    });

    it('在庫0の場合は当日を返す', () => {
      const baseDate = new Date('2026-03-05');
      const result = StockAlertEntity.predictStockoutDate(0, 1, baseDate);
      expect(result).toBe('2026-03-05');
    });

    it('在庫nullの場合はnullを返す', () => {
      const result = StockAlertEntity.predictStockoutDate(null, 1, new Date());
      expect(result).toBeNull();
    });

    it('消費量0の場合はnullを返す', () => {
      const result = StockAlertEntity.predictStockoutDate(10, 0, new Date());
      expect(result).toBeNull();
    });

    it('消費量が負の場合はnullを返す', () => {
      const result = StockAlertEntity.predictStockoutDate(10, -1, new Date());
      expect(result).toBeNull();
    });

    it('月をまたぐ場合も正しく計算する', () => {
      const baseDate = new Date('2026-03-28');
      const result = StockAlertEntity.predictStockoutDate(5, 1, baseDate);
      expect(result).toBe('2026-04-02');
    });
  });

  describe('getStockSufficiencyRate', () => {
    it('在庫10・1日消費1・目標7日の場合は100を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(10, 1, 7)).toBe(100);
    });

    it('在庫3・1日消費1・目標7日の場合は43を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(3, 1, 7)).toBe(43);
    });

    it('在庫0の場合は0を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(0, 1, 7)).toBe(0);
    });

    it('在庫nullの場合は0を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(null, 1, 7)).toBe(0);
    });

    it('消費量0の場合は100を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(5, 0, 7)).toBe(100);
    });

    it('目標日数0の場合は100を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyRate(5, 1, 0)).toBe(100);
    });
  });

  describe('getStockSufficiencyLabel', () => {
    it('100%は"十分"を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(100)).toBe('十分');
    });

    it('75%は"十分"を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(75)).toBe('十分');
    });

    it('50%は"やや不足"を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(50)).toBe('やや不足');
    });

    it('25%は"不足"を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(25)).toBe('不足');
    });

    it('0%は"不足"を返す', () => {
      expect(StockAlertEntity.getStockSufficiencyLabel(0)).toBe('不足');
    });
  });
});
