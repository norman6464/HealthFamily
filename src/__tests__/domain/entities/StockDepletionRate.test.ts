import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockDepletionRate', () => {
  it('初期在庫0は0', () => {
    expect(StockAlertEntity.getStockDepletionRate(0, 0)).toBe(0);
  });

  it('全て使用は100', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 0)).toBe(100);
  });

  it('使用なしは0', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 100)).toBe(0);
  });

  it('半分使用は50', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 50)).toBe(50);
  });

  it('使用が多いほど率が高い', () => {
    const low = StockAlertEntity.getStockDepletionRate(100, 80);
    const high = StockAlertEntity.getStockDepletionRate(100, 20);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = StockAlertEntity.getStockDepletionRate(50, 20);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('残りが初期より多い場合は0', () => {
    expect(StockAlertEntity.getStockDepletionRate(50, 80)).toBe(0);
  });
});

describe('StockAlertEntity.getStockDepletionRateLabel', () => {
  it('率高は急速消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(85)).toBe('急速消費');
  });

  it('率中は通常消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(55)).toBe('通常消費');
  });

  it('率低は低消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(25)).toBe('低消費');
  });
});
