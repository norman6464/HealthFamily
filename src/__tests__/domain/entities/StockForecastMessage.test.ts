import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity 在庫予測メッセージ', () => {
  describe('getStockForecastMessage', () => {
    it('残日数nullは在庫不明メッセージを返す', () => {
      expect(StockAlertEntity.getStockForecastMessage(null)).toBe('在庫数が不明です');
    });

    it('0日は即補充メッセージを返す', () => {
      expect(StockAlertEntity.getStockForecastMessage(0)).toBe('在庫がありません');
    });

    it('3日以内は緊急メッセージを返す', () => {
      expect(StockAlertEntity.getStockForecastMessage(2)).toBe('あと2日分の在庫です。早急に補充してください');
    });

    it('7日以内は注意メッセージを返す', () => {
      expect(StockAlertEntity.getStockForecastMessage(5)).toBe('あと5日分の在庫です。補充を検討してください');
    });

    it('7日超は余裕メッセージを返す', () => {
      expect(StockAlertEntity.getStockForecastMessage(14)).toBe('あと14日分の在庫があります');
    });
  });

  describe('getRefillUrgency', () => {
    it('nullはunknownを返す', () => {
      expect(StockAlertEntity.getRefillUrgency(null)).toBe('unknown');
    });

    it('0日はcriticalを返す', () => {
      expect(StockAlertEntity.getRefillUrgency(0)).toBe('critical');
    });

    it('3日以内はurgentを返す', () => {
      expect(StockAlertEntity.getRefillUrgency(3)).toBe('urgent');
    });

    it('7日以内はwarningを返す', () => {
      expect(StockAlertEntity.getRefillUrgency(7)).toBe('warning');
    });

    it('7日超はnormalを返す', () => {
      expect(StockAlertEntity.getRefillUrgency(8)).toBe('normal');
    });
  });

  describe('getDaysUntilStockout', () => {
    it('在庫nullはnullを返す', () => {
      expect(StockAlertEntity.getDaysUntilStockout(null, 2)).toBeNull();
    });

    it('消費量0はnullを返す', () => {
      expect(StockAlertEntity.getDaysUntilStockout(10, 0)).toBeNull();
    });

    it('在庫10で1日2消費は5日を返す', () => {
      expect(StockAlertEntity.getDaysUntilStockout(10, 2)).toBe(5);
    });

    it('端数は切り捨てる', () => {
      expect(StockAlertEntity.getDaysUntilStockout(7, 2)).toBe(3);
    });

    it('在庫0は0日を返す', () => {
      expect(StockAlertEntity.getDaysUntilStockout(0, 2)).toBe(0);
    });
  });
});
