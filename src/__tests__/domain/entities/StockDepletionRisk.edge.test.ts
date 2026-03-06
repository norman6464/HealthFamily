import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockDepletionRisk - エッジケース', () => {
  it('在庫0・消費0は0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(0, 0)).toBe(0);
  });

  it('在庫あり・消費0は0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(100, 0)).toBe(0);
  });

  it('在庫0・消費ありは100', () => {
    expect(StockAlertEntity.getStockDepletionRisk(0, 5)).toBe(100);
  });

  it('30日分ちょうどは0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(150, 5)).toBe(0);
  });

  it('30日分以上は0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(300, 5)).toBe(0);
  });

  it('15日分は50', () => {
    expect(StockAlertEntity.getStockDepletionRisk(75, 5)).toBe(50);
  });

  it('1日分は高リスク', () => {
    const result = StockAlertEntity.getStockDepletionRisk(5, 5);
    expect(result).toBeGreaterThanOrEqual(90);
  });

  it('消費量が非常に小さい場合', () => {
    const result = StockAlertEntity.getStockDepletionRisk(10, 0.1);
    expect(result).toBe(0);
  });

  it('消費量が非常に大きい場合', () => {
    const result = StockAlertEntity.getStockDepletionRisk(10, 100);
    expect(result).toBeGreaterThanOrEqual(90);
  });

  it('在庫が少ないほどリスクが高い', () => {
    const low = StockAlertEntity.getStockDepletionRisk(10, 5);
    const high = StockAlertEntity.getStockDepletionRisk(100, 5);
    expect(low).toBeGreaterThan(high);
  });

  it('消費が多いほどリスクが高い', () => {
    const fast = StockAlertEntity.getStockDepletionRisk(50, 10);
    const slow = StockAlertEntity.getStockDepletionRisk(50, 1);
    expect(fast).toBeGreaterThan(slow);
  });

  it('結果は0-100の範囲', () => {
    const result = StockAlertEntity.getStockDepletionRisk(20, 3);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('負の消費量は0', () => {
    expect(StockAlertEntity.getStockDepletionRisk(50, -5)).toBe(0);
  });

  it('負の在庫は100', () => {
    expect(StockAlertEntity.getStockDepletionRisk(-10, 5)).toBe(100);
  });
});

describe('StockAlertEntity.getStockDepletionRiskLabel - エッジケース', () => {
  it('スコア100は高リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(100)).toBe('高リスク');
  });

  it('スコア70は高リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(70)).toBe('高リスク');
  });

  it('スコア69は中リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(69)).toBe('中リスク');
  });

  it('スコア30は中リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(30)).toBe('中リスク');
  });

  it('スコア29は低リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(29)).toBe('低リスク');
  });

  it('スコア0は低リスク', () => {
    expect(StockAlertEntity.getStockDepletionRiskLabel(0)).toBe('低リスク');
  });
});
