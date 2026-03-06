import { describe, it, expect } from 'vitest';
import { StockAlertEntity } from '@/domain/entities/StockAlert';

describe('StockAlertEntity.getStockBurnRate - エッジケース', () => {
  it('在庫0は0を返す', () => {
    expect(StockAlertEntity.getStockBurnRate(0, 5)).toBe(0);
  });

  it('消費量0は0を返す', () => {
    expect(StockAlertEntity.getStockBurnRate(100, 0)).toBe(0);
  });

  it('負の在庫は0を返す', () => {
    expect(StockAlertEntity.getStockBurnRate(-10, 5)).toBe(0);
  });

  it('負の消費量は0を返す', () => {
    expect(StockAlertEntity.getStockBurnRate(100, -5)).toBe(0);
  });

  it('90日分ちょうどは100', () => {
    expect(StockAlertEntity.getStockBurnRate(90, 1)).toBe(100);
  });

  it('180日分でも100を超えない', () => {
    expect(StockAlertEntity.getStockBurnRate(180, 1)).toBe(100);
  });

  it('1日分は約1', () => {
    const result = StockAlertEntity.getStockBurnRate(1, 1);
    expect(result).toBe(1);
  });

  it('小数の消費量も正しく処理', () => {
    // 45個在庫、0.5個/日 = 90日分 -> 100
    expect(StockAlertEntity.getStockBurnRate(45, 0.5)).toBe(100);
  });

  it('大量在庫でも100を超えない', () => {
    expect(StockAlertEntity.getStockBurnRate(10000, 1)).toBe(100);
  });

  it('0-100の範囲内に収まる', () => {
    const result = StockAlertEntity.getStockBurnRate(5, 10);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('StockAlertEntity.getStockBurnRateLabel - 境界値', () => {
  it('スコア70は余裕あり(境界値)', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(70)).toBe('余裕あり');
  });

  it('スコア69はやや不足', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(69)).toBe('やや不足');
  });

  it('スコア40はやや不足(境界値)', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(40)).toBe('やや不足');
  });

  it('スコア39は不足', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(39)).toBe('不足');
  });

  it('スコア0は不足', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(0)).toBe('不足');
  });

  it('スコア100は余裕あり', () => {
    expect(StockAlertEntity.getStockBurnRateLabel(100)).toBe('余裕あり');
  });
});
