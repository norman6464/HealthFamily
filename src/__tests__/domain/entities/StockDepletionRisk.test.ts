import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockDepletionRisk', () => {
  it('在庫0は100', () => {
    expect(StockAlertEntity.getStockDepletionRisk(0, 5)).toBe(100);
  });

  it('消費0は0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(50, 0)).toBe(0);
  });

  it('在庫が消費の30日分以上は0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(150, 5)).toBe(0);
  });

  it('在庫が消費の数日分は高リスク', () => {
    const result = StockAlertEntity.getStockDepletionRisk(5, 5);
    expect(result).toBeGreaterThan(80);
  });

  it('結果は0-100', () => {
    const result = StockAlertEntity.getStockDepletionRisk(20, 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('在庫が少ないほどリスクが高い', () => {
    const low = StockAlertEntity.getStockDepletionRisk(5, 5);
    const high = StockAlertEntity.getStockDepletionRisk(50, 5);
    expect(low).toBeGreaterThan(high);
  });

  it('両方0は0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(0, 0)).toBe(0);
  });
});

describe('StockAlertEntity.getStockDepletionRiskLabel', () => {
  it('スコア70以上は高リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(80)).toBe('高リスク');
  });

  it('スコア30-70は中リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(50)).toBe('中リスク');
  });

  it('スコア30未満は低リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(10)).toBe('低リスク');
  });
});
