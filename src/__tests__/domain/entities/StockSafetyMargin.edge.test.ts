import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockSafetyMargin - エッジケース', () => {
  it('両方0は100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(0, 0)).toBe(100);
  });

  it('在庫あり・消費0は100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(100, 0)).toBe(100);
  });

  it('在庫0・消費ありは0', () => {
    expect(StockAlertEntity.getStockSafetyMargin(0, 5)).toBe(0);
  });

  it('30日分ちょうどは100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(150, 5)).toBe(100);
  });

  it('30日分以上も100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(300, 5)).toBe(100);
  });

  it('15日分は50', () => {
    expect(StockAlertEntity.getStockSafetyMargin(75, 5)).toBe(50);
  });

  it('1日分は低スコア', () => {
    const result = StockAlertEntity.getStockSafetyMargin(5, 5);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('消費量が非常に小さい場合', () => {
    const result = StockAlertEntity.getStockSafetyMargin(10, 0.1);
    expect(result).toBe(100);
  });

  it('消費量が非常に大きい場合', () => {
    const result = StockAlertEntity.getStockSafetyMargin(10, 100);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('在庫が多いほどスコアが高い', () => {
    const low = StockAlertEntity.getStockSafetyMargin(10, 5);
    const high = StockAlertEntity.getStockSafetyMargin(100, 5);
    expect(high).toBeGreaterThan(low);
  });

  it('消費が多いほどスコアが低い', () => {
    const fast = StockAlertEntity.getStockSafetyMargin(50, 10);
    const slow = StockAlertEntity.getStockSafetyMargin(50, 1);
    expect(slow).toBeGreaterThan(fast);
  });

  it('結果は0-100の範囲', () => {
    const result = StockAlertEntity.getStockSafetyMargin(20, 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('負の消費量は100', () => {
    expect(StockAlertEntity.getStockSafetyMargin(50, -5)).toBe(100);
  });

  it('負の在庫は0', () => {
    expect(StockAlertEntity.getStockSafetyMargin(-10, 5)).toBe(0);
  });
});

describe('StockAlertEntity.getStockSafetyMarginLabel - エッジケース', () => {
  it('スコア100は安全', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(100)).toBe('安全');
  });

  it('スコア70は安全', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(70)).toBe('安全');
  });

  it('スコア69は注意', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(69)).toBe('注意');
  });

  it('スコア30は注意', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(30)).toBe('注意');
  });

  it('スコア29は危険', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(29)).toBe('危険');
  });

  it('スコア0は危険', () => {
    expect(StockAlertEntity.getStockSafetyMarginLabel(0)).toBe('危険');
  });
});
