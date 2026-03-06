import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockConsistencyScore', () => {
  it('空配列は0', () => {
    expect(StockAlertEntity.getStockConsistencyScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(StockAlertEntity.getStockConsistencyScore([50])).toBe(100);
  });

  it('全て同じは100', () => {
    expect(StockAlertEntity.getStockConsistencyScore([10, 10, 10])).toBe(100);
  });

  it('ばらつきがあるとスコアが下がる', () => {
    const result = StockAlertEntity.getStockConsistencyScore([10, 50, 90]);
    expect(result).toBeLessThan(100);
    expect(result).toBeGreaterThan(0);
  });

  it('大きなばらつき', () => {
    const result = StockAlertEntity.getStockConsistencyScore([0, 100]);
    expect(result).toBeLessThan(50);
  });

  it('結果は0-100の範囲', () => {
    const result = StockAlertEntity.getStockConsistencyScore([20, 40, 60, 80]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('均一なほどスコアが高い', () => {
    const regular = StockAlertEntity.getStockConsistencyScore([50, 50, 50]);
    const irregular = StockAlertEntity.getStockConsistencyScore([10, 50, 90]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('2件で同値は100', () => {
    expect(StockAlertEntity.getStockConsistencyScore([30, 30])).toBe(100);
  });
});

describe('StockAlertEntity.getStockConsistencyScoreLabel', () => {
  it('スコア高は安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(85)).toBe('安定');
  });

  it('スコア中はやや不安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(60)).toBe('やや不安定');
  });

  it('スコア低は不安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(30)).toBe('不安定');
  });
});
