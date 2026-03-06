import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockVolatility - エッジケース', () => {
  it('空配列は0', () => {
    expect(StockAlertEntity.getStockVolatility([])).toBe(0);
  });

  it('1件は0', () => {
    expect(StockAlertEntity.getStockVolatility([50])).toBe(0);
  });

  it('2件の同値は0', () => {
    expect(StockAlertEntity.getStockVolatility([50, 50])).toBe(0);
  });

  it('2件の異なる値', () => {
    const result = StockAlertEntity.getStockVolatility([10, 60]);
    expect(result).toBeGreaterThan(0);
  });

  it('全て同値は0', () => {
    expect(StockAlertEntity.getStockVolatility([30, 30, 30, 30])).toBe(0);
  });

  it('全て0は0', () => {
    expect(StockAlertEntity.getStockVolatility([0, 0, 0])).toBe(0);
  });

  it('結果は0-100', () => {
    const result = StockAlertEntity.getStockVolatility([10, 30, 50, 70]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('極端な変動でも100を超えない', () => {
    const result = StockAlertEntity.getStockVolatility([0, 1000, 0, 1000]);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('微小な変動', () => {
    const result = StockAlertEntity.getStockVolatility([50, 51, 49, 50]);
    expect(result).toBeLessThan(10);
  });

  it('大量データでも正常', () => {
    const data = Array.from({ length: 100 }, (_, i) => 50 + (i % 5));
    const result = StockAlertEntity.getStockVolatility(data);
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('交互パターン', () => {
    const result = StockAlertEntity.getStockVolatility([10, 90, 10, 90, 10]);
    expect(result).toBeGreaterThan(50);
  });

  it('単調増加', () => {
    const result = StockAlertEntity.getStockVolatility([10, 20, 30, 40, 50]);
    expect(result).toBeGreaterThan(0);
  });

  it('単調減少', () => {
    const result = StockAlertEntity.getStockVolatility([50, 40, 30, 20, 10]);
    expect(result).toBeGreaterThan(0);
  });

  it('変動大 > 変動小', () => {
    const stable = StockAlertEntity.getStockVolatility([49, 50, 51]);
    const volatile = StockAlertEntity.getStockVolatility([0, 100, 0]);
    expect(volatile).toBeGreaterThan(stable);
  });

  it('同一値の長い配列は0', () => {
    const data = Array.from({ length: 50 }, () => 30);
    expect(StockAlertEntity.getStockVolatility(data)).toBe(0);
  });

  it('3件のデータ', () => {
    const result = StockAlertEntity.getStockVolatility([10, 50, 20]);
    expect(result).toBeGreaterThan(0);
  });
});

describe('StockAlertEntity.getStockVolatilityLabel - 境界値', () => {
  it('スコア0は安定', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(0)).toBe('安定');
  });

  it('スコア30は安定(境界値)', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(30)).toBe('安定');
  });

  it('スコア31はやや変動', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(31)).toBe('やや変動');
  });

  it('スコア60はやや変動(境界値)', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(60)).toBe('やや変動');
  });

  it('スコア61は変動大', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(61)).toBe('変動大');
  });

  it('スコア100は変動大', () => {
    expect(StockAlertEntity.getStockVolatilityLabel(100)).toBe('変動大');
  });
});
