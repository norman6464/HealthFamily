import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockBurnRate', () => {
  it('在庫0は0を返す', () => {
    expect(StockAlertEntity.getStockBurnRate(0, 5)).toBe(0);
  });

  it('消費量0は0を返す', () => {
    expect(StockAlertEntity.getStockBurnRate(100, 0)).toBe(0);
  });

  it('低消費速度は高スコア(余裕あり)', () => {
    // 100個在庫、1日1個消費 = 100日分 -> 高スコア
    const result = StockAlertEntity.getStockBurnRate(100, 1);
    expect(result).toBeGreaterThan(70);
  });

  it('高消費速度は低スコア(余裕なし)', () => {
    // 10個在庫、10日消費 = 1日分 -> 低スコア
    const result = StockAlertEntity.getStockBurnRate(10, 10);
    expect(result).toBeLessThan(30);
  });

  it('30日分は33スコア(90日基準)', () => {
    const result = StockAlertEntity.getStockBurnRate(30, 1);
    expect(result).toBe(33);
  });

  it('0-100の範囲内に収まる', () => {
    const result1 = StockAlertEntity.getStockBurnRate(1000, 1);
    const result2 = StockAlertEntity.getStockBurnRate(1, 100);
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThanOrEqual(100);
  });
});

describe('StockAlertEntity.getStockBurnRateLabel', () => {
  it('スコア70以上は余裕あり', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(70)).toBe('余裕あり');
  });

  it('スコア40以上はやや不足', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(50)).toBe('やや不足');
  });

  it('スコア40未満は不足', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(20)).toBe('不足');
  });
});
