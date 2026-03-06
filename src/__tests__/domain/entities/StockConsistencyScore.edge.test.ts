import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockConsistencyScore - エッジケース', () => {
  it('空配列は0', () => {
    expect(StockAlertEntity.getStockConsistencyScore([])).toBe(0);
  });

  it('1件は100', () => {
    expect(StockAlertEntity.getStockConsistencyScore([50])).toBe(100);
  });

  it('全て同じは100', () => {
    expect(StockAlertEntity.getStockConsistencyScore([30, 30, 30, 30])).toBe(100);
  });

  it('2件同値は100', () => {
    expect(StockAlertEntity.getStockConsistencyScore([20, 20])).toBe(100);
  });

  it('全て0は0', () => {
    expect(StockAlertEntity.getStockConsistencyScore([0, 0, 0])).toBe(0);
  });

  it('わずかなばらつき', () => {
    const result = StockAlertEntity.getStockConsistencyScore([49, 50, 51]);
    expect(result).toBeGreaterThan(95);
  });

  it('大きなばらつき', () => {
    const result = StockAlertEntity.getStockConsistencyScore([0, 100]);
    expect(result).toBeLessThan(50);
  });

  it('均一なほどスコアが高い', () => {
    const regular = StockAlertEntity.getStockConsistencyScore([50, 50, 50]);
    const irregular = StockAlertEntity.getStockConsistencyScore([10, 50, 90]);
    expect(regular).toBeGreaterThan(irregular);
  });

  it('結果は0-100の範囲', () => {
    const result = StockAlertEntity.getStockConsistencyScore([5, 15, 25, 35]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('大量データで均一', () => {
    const data = Array(50).fill(20);
    expect(StockAlertEntity.getStockConsistencyScore(data)).toBe(100);
  });

  it('大きな値', () => {
    expect(StockAlertEntity.getStockConsistencyScore([1000, 1000])).toBe(100);
  });
});

describe('StockAlertEntity.getStockConsistencyScoreLabel - エッジケース', () => {
  it('スコア100は安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(100)).toBe('安定');
  });

  it('スコア80は安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(80)).toBe('安定');
  });

  it('スコア79はやや不安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(79)).toBe('やや不安定');
  });

  it('スコア50はやや不安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(50)).toBe('やや不安定');
  });

  it('スコア49は不安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(49)).toBe('不安定');
  });

  it('スコア0は不安定', () => {
    expect(StockAlertEntity.getStockConsistencyScoreLabel(0)).toBe('不安定');
  });
});
