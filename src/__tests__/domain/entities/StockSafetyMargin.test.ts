import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockSafetyMargin', () => {
  it('消費0は100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(100, 0)).toBe(100);
  });

  it('在庫0は0', () => {
    expect(StockAlertEntity.getStockSafetyMargin(0, 5)).toBe(0);
  });

  it('両方0は100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(0, 0)).toBe(100);
  });

  it('30日分以上は100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(150, 5)).toBe(100);
  });

  it('15日分は50', () => {
    expect(StockAlertEntity.getStockSafetyMargin(75, 5)).toBe(50);
  });

  it('1日分は低スコア', () => {
    const result = StockAlertEntity.getStockSafetyMargin(5, 5);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('在庫が多いほどスコアが高い', () => {
    const low = StockAlertEntity.getStockSafetyMargin(10, 5);
    const high = StockAlertEntity.getStockSafetyMargin(100, 5);
    expect(high).toBeGreaterThan(low);
  });

  it('消費が多いほどスコアが低い', () => {
    const low = StockAlertEntity.getStockSafetyMargin(50, 10);
    const high = StockAlertEntity.getStockSafetyMargin(50, 1);
    expect(high).toBeGreaterThan(low);
  });

  it('結果は0-100の範囲', () => {
    const result = StockAlertEntity.getStockSafetyMargin(20, 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('StockAlertEntity.getStockSafetyMarginLabel', () => {
  it('スコア70以上は安全', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(80)).toBe('安全');
  });

  it('スコア30-70は注意', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(50)).toBe('注意');
  });

  it('スコア30未満は危険', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(20)).toBe('危険');
  });
});
