import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockVolatility', () => {
  it('空配列は0', () => {
    expect(StockAlertEntity.getStockVolatility([])).toBe(0);
  });

  it('1件は0', () => {
    expect(StockAlertEntity.getStockVolatility([30])).toBe(0);
  });

  it('全て同値は0', () => {
    expect(StockAlertEntity.getStockVolatility([50, 50, 50])).toBe(0);
  });

  it('大きな変動は高スコア', () => {
    const result = StockAlertEntity.getStockVolatility([10, 90, 10, 90]);
    expect(result).toBeGreaterThan(50);
  });

  it('小さな変動は低スコア', () => {
    const result = StockAlertEntity.getStockVolatility([49, 50, 51, 50]);
    expect(result).toBeLessThan(20);
  });

  it('結果は0-100', () => {
    const result = StockAlertEntity.getStockVolatility([10, 30, 50, 70]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('変動が大きい方がスコアが高い', () => {
    const stable = StockAlertEntity.getStockVolatility([48, 50, 52]);
    const volatile = StockAlertEntity.getStockVolatility([10, 80, 20]);
    expect(volatile).toBeGreaterThan(stable);
  });
});

describe('StockAlertEntity.getStockVolatilityLabel', () => {
  it('スコア30以下は安定', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(20)).toBe('安定');
  });

  it('スコア30-60はやや変動', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(45)).toBe('やや変動');
  });

  it('スコア60超は変動大', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(70)).toBe('変動大');
  });
});
