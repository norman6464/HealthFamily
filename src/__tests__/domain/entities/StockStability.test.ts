import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockStabilityScore', () => {
  it('空配列は0を返す', () => {
    expect(StockAlertEntity.getStockStabilityScore([])).toBe(0);
  });

  it('1件のみは100を返す', () => {
    expect(StockAlertEntity.getStockStabilityScore([50])).toBe(100);
  });

  it('全て同じ値は100を返す', () => {
    expect(StockAlertEntity.getStockStabilityScore([30, 30, 30, 30])).toBe(100);
  });

  it('安定した在庫は高スコア', () => {
    const result = StockAlertEntity.getStockStabilityScore([100, 99, 100, 101, 100]);
    expect(result).toBeGreaterThan(90);
  });

  it('大きく変動する在庫は低スコア', () => {
    const result = StockAlertEntity.getStockStabilityScore([10, 100, 10, 100, 10]);
    expect(result).toBeLessThan(30);
  });

  it('緩やかに減少する在庫は中程度のスコア', () => {
    const result = StockAlertEntity.getStockStabilityScore([100, 80, 60, 40, 20]);
    expect(result).toBeGreaterThan(30);
    expect(result).toBeLessThan(80);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = StockAlertEntity.getStockStabilityScore([0, 1000]);
    const result2 = StockAlertEntity.getStockStabilityScore([50, 50]);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
  });
});

describe('StockAlertEntity.getStockStabilityLabel', () => {
  it('スコア80以上は安定', () => {
    expect(StockAlertEntity.getStockStabilityLabel(80)).toBe('安定');
  });

  it('スコア50以上はやや不安定', () => {
    expect(StockAlertEntity.getStockStabilityLabel(50)).toBe('やや不安定');
  });

  it('スコア50未満は不安定', () => {
    expect(StockAlertEntity.getStockStabilityLabel(30)).toBe('不安定');
  });
});
