import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockDepletionRate - エッジケース', () => {
  it('初期0・残0は0', () => {
    expect(StockAlertEntity.getStockDepletionRate(0, 0)).toBe(0);
  });

  it('初期0・残10は0', () => {
    expect(StockAlertEntity.getStockDepletionRate(0, 10)).toBe(0);
  });

  it('初期100・残0は100', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 0)).toBe(100);
  });

  it('初期100・残100は0', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 100)).toBe(0);
  });

  it('残りが初期より多い場合は0', () => {
    expect(StockAlertEntity.getStockDepletionRate(50, 80)).toBe(0);
  });

  it('半分使用は50', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 50)).toBe(50);
  });

  it('1/4使用は25', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 75)).toBe(25);
  });

  it('3/4使用は75', () => {
    expect(StockAlertEntity.getStockDepletionRate(100, 25)).toBe(75);
  });

  it('初期1・残0は100', () => {
    expect(StockAlertEntity.getStockDepletionRate(1, 0)).toBe(100);
  });

  it('使用が多いほど率が高い', () => {
    const low = StockAlertEntity.getStockDepletionRate(100, 90);
    const high = StockAlertEntity.getStockDepletionRate(100, 10);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = StockAlertEntity.getStockDepletionRate(80, 30);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('負の初期在庫は0', () => {
    expect(StockAlertEntity.getStockDepletionRate(-10, 5)).toBe(0);
  });
});

describe('StockAlertEntity.getStockDepletionRateLabel - エッジケース', () => {
  it('100は急速消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(100)).toBe('急速消費');
  });

  it('70は急速消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(70)).toBe('急速消費');
  });

  it('69は通常消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(69)).toBe('通常消費');
  });

  it('40は通常消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(40)).toBe('通常消費');
  });

  it('39は低消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(39)).toBe('低消費');
  });

  it('0は低消費', () => {
    expect(StockAlertEntity.getStockDepletionRateLabel(0)).toBe('低消費');
  });
});
