import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫予測 エッジケース', () => {
  describe('getStockForecastMessage', () => {
    it('境界値3日は緊急メッセージを返す', () => {
      const msg = StockAlertEntity.getStockForecastMessage(3);
      expect(msg).toContain('早急に補充');
    });

    it('境界値4日は注意メッセージを返す', () => {
      const msg = StockAlertEntity.getStockForecastMessage(4);
      expect(msg).toContain('補充を検討');
    });

    it('境界値7日は注意メッセージを返す', () => {
      const msg = StockAlertEntity.getStockForecastMessage(7);
      expect(msg).toContain('補充を検討');
    });

    it('境界値8日は余裕メッセージを返す', () => {
      const msg = StockAlertEntity.getStockForecastMessage(8);
      expect(msg).toContain('在庫があります');
    });
  });

  describe('getRefillUrgency', () => {
    it('1日はurgentを返す', () => {
      expect(StockAlertEntity.getRefillUrgency(1)).toBe('urgent');
    });

    it('4日はwarningを返す', () => {
      expect(StockAlertEntity.getRefillUrgency(4)).toBe('warning');
    });
  });

  describe('getDaysUntilStockout', () => {
    it('負の消費量はnullを返す', () => {
      expect(StockAlertEntity.getDaysUntilStockout(10, -1)).toBeNull();
    });

    it('小数の消費量で計算できる', () => {
      expect(StockAlertEntity.getDaysUntilStockout(10, 0.5)).toBe(20);
    });

    it('大量在庫でも正しく計算する', () => {
      expect(StockAlertEntity.getDaysUntilStockout(1000, 3)).toBe(333);
    });
  });
});
